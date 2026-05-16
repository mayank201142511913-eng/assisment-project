const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:mtWMjKhBalBnOqKXGDTtoahJvmTUHerp@postgres.railway.internal:5432/railway"
    }
  }
});

// Get dashboard data (tasks for current user grouped by status + overdue)
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    
    const dashboard = {
      todo: tasks.filter(t => t.status === 'TODO'),
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS'),
      done: tasks.filter(t => t.status === 'DONE'),
      overdue: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'DONE')
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a task (Admin only)
router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { title, description, dueDate, projectId, assigneeId } = req.body;

    // Verify project exists and user is owner
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add tasks to this project' });
    }

    // Verify assignee is part of project team
    if (assigneeId) {
      const isMember = await prisma.teamMember.findFirst({
        where: { projectId, userId: assigneeId }
      });
      if (!isMember) {
        return res.status(400).json({ error: 'Assignee is not a member of this project' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || req.user.id
      }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task status (Assignee or Admin)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check permissions: Admin (owner) or Assignee
    if (task.project.ownerId !== req.user.id && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status }
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
