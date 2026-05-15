const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects for current user (either as owner or team member)
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { teamMembers: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true, teamMembers: true } },
        teamMembers: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a project (Admin only)
router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
      }
    });

    // Add owner as a team member automatically
    await prisma.teamMember.create({
      data: {
        projectId: project.id,
        userId: req.user.id,
        role: 'ADMIN'
      }
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: req.user.id },
          { teamMembers: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true } },
        tasks: {
          include: { assignee: { select: { id: true, name: true } } }
        },
        teamMembers: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a team member to project (Admin only)
router.post('/:id/members', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { email } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add members to this project' });
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return res.status(404).json({ error: 'User with this email not found' });
    }

    const membership = await prisma.teamMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role: 'MEMBER'
      }
    });

    res.status(201).json(membership);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
