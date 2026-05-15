import { useState, useEffect } from 'react';

function Dashboard({ user }) {
  const [data, setData] = useState({ todo: [], inProgress: [], done: [], overdue: [] });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Form states
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', projectId: '', dueDate: '', assigneeId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [dashRes, projRes] = await Promise.all([
        fetch('/api/tasks/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (dashRes.ok) setData(await dashRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(projectForm)
      });
      if (res.ok) {
        setIsProjectModalOpen(false);
        setProjectForm({ name: '', description: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          ...taskForm, 
          projectId: parseInt(taskForm.projectId),
          assigneeId: taskForm.assigneeId ? parseInt(taskForm.assigneeId) : undefined
        })
      });
      if (res.ok) {
        setIsTaskModalOpen(false);
        setTaskForm({ title: '', description: '', projectId: '', dueDate: '', assigneeId: '' });
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to create task');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  const TaskCard = ({ task }) => (
    <div className="card animate-fade-in" style={{ padding: '1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h4 style={{ margin: 0 }}>{task.title}</h4>
        <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status.replace('_', ' ')}</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Project: {task.project?.name}
      </p>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {task.status !== 'TODO' && (
          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => updateTaskStatus(task.id, 'TODO')}>To Do</button>
        )}
        {task.status !== 'IN_PROGRESS' && (
          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}>Start</button>
        )}
        {task.status !== 'DONE' && (
          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--success-color)', border: 'none', color: 'white' }} onClick={() => updateTaskStatus(task.id, 'DONE')}>Done</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Tasks</h1>
        {user.role === 'ADMIN' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsTaskModalOpen(true)}>+ New Task</button>
            <button className="btn btn-primary" onClick={() => setIsProjectModalOpen(true)}>+ New Project</button>
          </div>
        )}
      </div>

      {data.overdue?.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger-color)', display: 'inline-block' }}></span>
            Overdue Tasks
          </h3>
          <div className="grid grid-cols-3">
            {data.overdue.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
        <div>
          <h3>To Do ({data.todo?.length || 0})</h3>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '1rem', minHeight: '300px' }}>
            {data.todo?.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
        
        <div>
          <h3>In Progress ({data.inProgress?.length || 0})</h3>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '1rem', minHeight: '300px' }}>
            {data.inProgress?.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
        
        <div>
          <h3>Done ({data.done?.length || 0})</h3>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '1rem', minHeight: '300px' }}>
            {data.done?.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '3rem' }}>
        <h2>My Projects</h2>
        <div className="grid grid-cols-3">
          {projects.map(proj => (
            <div key={proj.id} className="card glass-panel">
              <h4>{proj.name}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {proj.description || 'No description'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>{proj._count?.tasks || 0} Tasks</span>
                <span>{proj._count?.teamMembers || 0} Members</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Create New Project</h2>
              <button onClick={() => setIsProjectModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input type="text" className="form-input" required value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProjectModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Create New Task</h2>
              <button onClick={() => setIsTaskModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" className="form-input" required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Project</label>
                <select className="form-select" required value={taskForm.projectId} onChange={e => setTaskForm({...taskForm, projectId: e.target.value, assigneeId: ''})}>
                  <option value="" disabled>Select a project</option>
                  {projects.filter(p => p.ownerId === user.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {taskForm.projectId && (
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-select" value={taskForm.assigneeId || ''} onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})}>
                    <option value="">Self (Default)</option>
                    {projects.find(p => p.id === parseInt(taskForm.projectId))?.teamMembers?.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
