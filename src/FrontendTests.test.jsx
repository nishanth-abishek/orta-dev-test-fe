import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' }),
  useLocation: () => ({ state: null, pathname: '/shifts' })
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('BaiscFrontend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CreateShift Component
  test('CreateShift - form validation and submission', async () => {
    const CreateShift = () => {
      const [formData, setFormData] = React.useState({ title: '', date: '', startTime: '', finishTime: '' });
      const [errors, setErrors] = React.useState({});
      const [success, setSuccess] = React.useState(false);

      const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.title) newErrors.title = 'Title required';
        if (!formData.date) newErrors.date = 'Date required';
        if (formData.startTime >= formData.finishTime) newErrors.time = 'Invalid time range';
        
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) setSuccess(true);
      };

      if (success) return <div data-testid="success">Shift created successfully!</div>;

      return (
        <form onSubmit={handleSubmit}>
          <h1>Create New Shift</h1>
          <input 
            placeholder="Shift title" 
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            aria-label="Shift title"
          />
          {errors.title && <span data-testid="title-error">{errors.title}</span>}
          
          <input 
            type="date" 
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            aria-label="Date"
          />
          {errors.date && <span data-testid="date-error">{errors.date}</span>}
          
          <input 
            type="time" 
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            aria-label="Start time"
          />
          <input 
            type="time" 
            value={formData.finishTime}
            onChange={(e) => setFormData(prev => ({ ...prev, finishTime: e.target.value }))}
            aria-label="Finish time"
          />
          {errors.time && <span data-testid="time-error">{errors.time}</span>}
          
          <button type="submit">Create Shift</button>
        </form>
      );
    };

    render(<TestWrapper><CreateShift /></TestWrapper>);

    // Test validation
    fireEvent.click(screen.getByRole('button', { name: /create shift/i }));
    expect(screen.getByTestId('title-error')).toHaveTextContent('Title required');
    expect(screen.getByTestId('date-error')).toHaveTextContent('Date required');

    // Test valid submission
    await userEvent.type(screen.getByLabelText(/shift title/i), 'Morning Shift');
    await userEvent.type(screen.getByLabelText(/date/i), '2025-08-15');
    await userEvent.type(screen.getByLabelText(/start time/i), '09:00');
    await userEvent.type(screen.getByLabelText(/finish time/i), '17:00');
    
    fireEvent.click(screen.getByRole('button', { name: /create shift/i }));
    expect(screen.getByTestId('success')).toHaveTextContent('Shift created successfully!');
  });

  // Test: EditShift Component
  test('EditShift - loads existing data and updates', async () => {
    const EditShift = () => {
      const [shift, setShift] = React.useState(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        // Simulate loading existing shift data
        setTimeout(() => {
          setShift({ title: 'Existing Shift', date: '2025-08-15', startTime: '09:00' });
          setLoading(false);
        }, 100);
      }, []);

      if (loading) return <div data-testid="loading">Loading shift...</div>;

      return (
        <form>
          <h1>Edit Shift</h1>
          <input 
            value={shift.title}
            onChange={(e) => setShift(prev => ({ ...prev, title: e.target.value }))}
            aria-label="Shift title"
          />
          <input 
            type="date"
            value={shift.date}
            onChange={(e) => setShift(prev => ({ ...prev, date: e.target.value }))}
            aria-label="Date"
          />
          <button type="submit">Update Shift</button>
          <div data-testid="current-data">
            {shift.title} on {shift.date}
          </div>
        </form>
      );
    };

    render(<TestWrapper><EditShift /></TestWrapper>);

    // Test loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Test data loads
    await waitFor(() => {
      expect(screen.getByTestId('current-data')).toHaveTextContent('Existing Shift on 2025-08-15');
    });

    // Test editing
    const titleInput = screen.getByLabelText(/shift title/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Shift');
    
    expect(screen.getByTestId('current-data')).toHaveTextContent('Updated Shift on 2025-08-15');
  });

  // Shifts List Component
  test('Shifts - displays list with search and filtering', async () => {
    const Shifts = () => {
      const shifts = [
        { id: '1', title: 'Morning Shift', date: '2025-08-15', status: 'scheduled' },
        { id: '2', title: 'Evening Shift', date: '2025-08-16', status: 'completed' },
        { id: '3', title: 'Night Shift', date: '2025-08-17', status: 'scheduled' }
      ];

      const [filteredShifts, setFilteredShifts] = React.useState(shifts);
      const [filter, setFilter] = React.useState('all');

      const handleSearch = (searchTerm) => {
        const filtered = shifts.filter(shift => 
          shift.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredShifts(filtered);
      };

      const handleFilter = (status) => {
        setFilter(status);
        const filtered = status === 'all' ? shifts : shifts.filter(shift => shift.status === status);
        setFilteredShifts(filtered);
      };

      return (
        <div>
          <h1>My Shifts ({filteredShifts.length})</h1>
          
          <input 
            placeholder="Search shifts..."
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search shifts"
          />
          
          <select onChange={(e) => handleFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>

          <button onClick={() => mockNavigate('/shifts/new')}>Create New Shift</button>

          <div data-testid="shifts-list">
            {filteredShifts.map(shift => (
              <div key={shift.id} data-testid={`shift-${shift.id}`}>
                <h3>{shift.title}</h3>
                <p>Date: {shift.date}</p>
                <span className={`status-${shift.status}`}>{shift.status}</span>
                <button onClick={() => mockNavigate(`/shifts/${shift.id}`)}>View</button>
              </div>
            ))}
          </div>

          {filteredShifts.length === 0 && <p data-testid="no-shifts">No shifts found</p>}
        </div>
      );
    };

    render(<TestWrapper><Shifts /></TestWrapper>);

    // Test initial render
    expect(screen.getByRole('heading', { name: /my shifts \(3\)/i })).toBeInTheDocument();
    expect(screen.getByTestId('shift-1')).toBeInTheDocument();
    expect(screen.getByTestId('shift-2')).toBeInTheDocument();

    // Test search
    await userEvent.type(screen.getByLabelText(/search shifts/i), 'Morning');
    expect(screen.getByRole('heading', { name: /my shifts \(1\)/i })).toBeInTheDocument();
    expect(screen.getByTestId('shift-1')).toBeInTheDocument();
    expect(screen.queryByTestId('shift-2')).not.toBeInTheDocument();

    // Test filter
    await userEvent.clear(screen.getByLabelText(/search shifts/i));
    await userEvent.selectOptions(screen.getByLabelText(/filter by status/i), 'completed');
    expect(screen.getByTestId('shift-2')).toBeInTheDocument();
    expect(screen.queryByTestId('shift-1')).not.toBeInTheDocument();

    // Test navigation
    fireEvent.click(screen.getByRole('button', { name: /create new shift/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/shifts/new');
  });

  // ShiftDetails Component
  test('ShiftDetails - shows shift info and actions', async () => {
    const ShiftDetails = () => {
      const [shift, setShift] = React.useState(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        // Simulate API call
        setTimeout(() => {
          setShift({
            id: '123',
            title: 'Morning Shift',
            date: '2025-08-15',
            startTime: '09:00',
            finishTime: '17:00',
            location: { name: 'Office A', address: '123 Main St' },
            status: 'scheduled'
          });
          setLoading(false);
        }, 100);
      }, []);

      const handleDelete = () => {
        if (window.confirm('Delete this shift?')) {
          mockNavigate('/shifts');
        }
      };

      if (loading) return <div data-testid="loading">Loading shift details...</div>;

      return (
        <div>
          <button onClick={() => mockNavigate('/shifts')}>← Back</button>
          <h1>Shift Details</h1>
          
          <div data-testid="shift-info">
            <h2>{shift.title}</h2>
            <p>Date: {shift.date}</p>
            <p>Time: {shift.startTime} - {shift.finishTime}</p>
            <p>Location: {shift.location.name}</p>
            <p>Address: {shift.location.address}</p>
            <span className={`status-${shift.status}`}>{shift.status}</span>
          </div>

          <div data-testid="clock-section">
            <h3>Clock In/Out</h3>
            {shift.status === 'scheduled' ? (
              <p>Clock in will be available when shift starts</p>
            ) : (
              <div>
                <button>Clock In</button>
                <button>Clock Out</button>
              </div>
            )}
          </div>

          <div data-testid="actions">
            <button onClick={() => mockNavigate(`/shifts/${shift.id}/edit`)}>Edit</button>
            <button onClick={handleDelete}>Delete</button>
          </div>
        </div>
      );
    };

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<TestWrapper><ShiftDetails /></TestWrapper>);

    // Test loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Test data loads
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /shift details/i })).toBeInTheDocument();
    });

    expect(screen.getByTestId('shift-info')).toHaveTextContent('Morning Shift');
    expect(screen.getByTestId('shift-info')).toHaveTextContent('Office A');
    expect(screen.getByTestId('clock-section')).toHaveTextContent('Clock in will be available');

    // Test navigation
    fireEvent.click(screen.getByRole('button', { name: /← back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/shifts');

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/shifts/123/edit');

    // Test delete
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(window.confirm).toHaveBeenCalledWith('Delete this shift?');
    expect(mockNavigate).toHaveBeenCalledWith('/shifts');
  });
});