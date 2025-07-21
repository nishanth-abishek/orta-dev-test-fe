import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../Axios/axios";
import TokenContext from "../../context/TokenContext";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function Shifts() {
  const { userToken, user } = useContext(TokenContext);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const navigate = useNavigate();
  const location = useLocation();

  const [showDeletedBanner, setShowDeletedBanner] = useState(false);
  useEffect(() => {
    if (location.state?.deleted) {
      setShowDeletedBanner(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.deleted, navigate, location.pathname]);

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      setError(null);
      if (!userToken || !user?._id) {
        setError("Please log in to view shifts");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("/shifts", {
          params: { userId: user._id },
          headers: { Authorization: `Bearer ${userToken}` },
        });
        setShifts(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Could not load shifts");
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, [userToken, user]);

  /**
   * Determine shift status using full Date object,
   * so we respect UTC->local timezone correctly.
   */
  const getShiftStatus = (shift) => {
    const now = new Date();
    const base = new Date(shift.date);
    const [h1, m1] = shift.startTime.split(":").map(Number);
    const [h2, m2] = shift.finishTime.split(":").map(Number);
    const start = new Date(base);
    start.setHours(h1, m1, 0, 0);
    const end = new Date(base);
    end.setHours(h2, m2, 0, 0);
    if (end < start) end.setDate(end.getDate() + 1);
    if (now < start) return "Scheduled";
    if (now <= end) return "In Progress";
    return "Completed";
  };

  // Get all shifts (not just upcoming) for calendar view
  const allShifts = shifts.sort((a, b) => {
    const makeDate = (s) => {
      const day = new Date(s.date);
      const [h, m] = s.startTime.split(':').map(Number);
      const dt = new Date(day);
      dt.setHours(h, m, 0, 0);
      return dt;
    };
    return makeDate(a) - makeDate(b);
  });

  // Only upcoming or in-progress for table view
  const upcoming = shifts
    .filter((s) => {
      const st = getShiftStatus(s);
      return st === "Scheduled" || st === "In Progress";
    })
    .sort((a, b) => {
      const makeDate = (s) => {
        const day = new Date(s.date);
        const [h, m] = s.startTime.split(':').map(Number);
        const dt = new Date(day);
        dt.setHours(h, m, 0, 0);
        return dt;
      };
      return makeDate(a) - makeDate(b);
    });

  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const tm = new Date();
    tm.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tm.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    // Use local date string to avoid timezone issues
    const dayKey = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    
    const dayShifts = allShifts.filter((s) => {
      const shiftDate = new Date(s.date);
      const shiftKey = shiftDate.getFullYear() + '-' + 
        String(shiftDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(shiftDate.getDate()).padStart(2, '0');
      return shiftKey === dayKey;
    });
    
    if (dayShifts.length === 0) return null;
    
    return (
      <div className="w-full mt-1">
        {dayShifts.slice(0, 2).map((s) => {
          const status = getShiftStatus(s);
          const isCompleted = status === "Completed";
          
          return (
            <div
              key={s._id}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/shifts/${s._id}`);
              }}
              className={`text-[10px] leading-tight px-1 py-0.5 mb-0.5 rounded cursor-pointer transition-colors ${
                isCompleted 
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                  : status === "In Progress"
                  ? 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                  : 'bg-green-200 text-green-800 hover:bg-green-300'
              }`}
              title={`${s.title} - ${formatTime(s.startTime)}`}
            >
              <div className="truncate font-medium">
                {formatTime(s.startTime)} {s.title}
              </div>
            </div>
          );
        })}
        {dayShifts.length > 2 && (
          <div className="text-[10px] text-gray-500 px-1 cursor-pointer hover:text-gray-700">
            +{dayShifts.length - 2} more
          </div>
        )}
      </div>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";
    // Use local date string to avoid timezone issues
    const dayKey = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    
    const hasShifts = allShifts.some((s) => {
      const shiftDate = new Date(s.date);
      const shiftKey = shiftDate.getFullYear() + '-' + 
        String(shiftDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(shiftDate.getDate()).padStart(2, '0');
      return shiftKey === dayKey;
    });
    
    // Add custom styles for calendar tiles
    let className = "";
    if (hasShifts) {
      className += " has-shifts";
    }
    
    // Highlight today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      className += " react-calendar__tile--now";
    }
    
    return className;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {showDeletedBanner && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded">
          Shift deleted successfully!
        </div>
      )}
      


      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Shifts</h1>
            <p className="mt-2 text-gray-600">View and manage your scheduled shifts. Switch between calendar and table view.</p>
          </div>
          <button
            onClick={() => navigate("/shifts/create")}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-md inline-flex items-center"
          >
            <span className="mr-2">+</span>Create Shift
          </button>
        </div>

        <div className="inline-flex border bg-white rounded-lg p-1 mb-8">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              viewMode === "calendar" 
                ? "bg-gray-900 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              viewMode === "table" 
                ? "bg-gray-900 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Table View
          </button>
        </div>

        {viewMode === "calendar" ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div style={{ 
              '--react-calendar-tile-height': '120px'
            }}>
              <Calendar
                tileContent={tileContent}
                tileClassName={tileClassName}
                onClickDay={(date) => {
                  console.log('Calendar day clicked:', date);
                  // Use local date string to avoid timezone issues
                  const dayKey = date.getFullYear() + '-' + 
                    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(date.getDate()).padStart(2, '0');
                  
                  const dayShifts = allShifts.filter((s) => {
                    const shiftDate = new Date(s.date);
                    const shiftKey = shiftDate.getFullYear() + '-' + 
                      String(shiftDate.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(shiftDate.getDate()).padStart(2, '0');
                    return shiftKey === dayKey;
                  });
                  
                  console.log('Day shifts found:', dayShifts);
                  if (dayShifts.length >= 1) {
                    navigate(`/shifts/${dayShifts[0]._id}`);
                  }
                }}
              />
            </div>
            
            {/* Add CSS styles directly in the component */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .react-calendar {
                  width: 100% !important;
                  border: none !important;
                  font-family: inherit;
                }
                
                .react-calendar__tile {
                  height: 120px !important;
                  padding: 4px !important;
                  border: 1px solid #e5e7eb !important;
                  background: white !important;
                  vertical-align: top !important;
                  position: relative !important;
                }
                
                .react-calendar__tile:hover {
                  background-color: #f9fafb !important;
                }
                
                .react-calendar__tile--now {
                  background-color: #dbeafe !important;
                  border-color: #3b82f6 !important;
                }
                
                .react-calendar__month-view__weekdays__weekday {
                  padding: 12px 4px !important;
                  font-weight: 600 !important;
                  color: #374151 !important;
                  background-color: #f9fafb !important;
                }
              `
            }} />
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Date","Shift","Time","Location","Status","Actions"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcoming.map(s => {
                  const status = getShiftStatus(s);
                  return (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatDate(s.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{s.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">🕒 {s.startTime} - {s.finishTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {s.location?.name && <div className="text-sm font-semibold text-gray-900">{s.location.name}</div>}
                        <div className="text-xs text-gray-500">{[s.location?.constituency, s.location?.adminDistrict, s.location?.postCode].filter(Boolean).join(", ")}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          status === "Scheduled" 
                            ? "bg-blue-100 text-blue-800" 
                            : status === "In Progress" 
                            ? "bg-orange-100 text-orange-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => navigate(`/shifts/${s._id}`)} 
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          View
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}