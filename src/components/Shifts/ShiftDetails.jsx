import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../../Axios/axios";
import TokenContext from "../../context/TokenContext";

export default function ShiftDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userToken, user } = useContext(TokenContext);
  
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  const justUpdated = location.state?.updated;

  useEffect(() => {
    if (justUpdated) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [justUpdated, navigate, location.pathname]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      () => console.log("Could not get location")
    );
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  useEffect(() => {
    if (userLocation && shift?.location?.cordinates) {
      const { latitude, longitude } = shift.location.cordinates;
      if (latitude && longitude) {
        setDistance(calculateDistance(userLocation.lat, userLocation.lng, latitude, longitude));
      }
    }
  }, [userLocation, shift]);

  useEffect(() => {
    if (!id || !userToken || !user?._id) {
      setError("Please log in to view shift details");
      setLoading(false);
      return;
    }

    axios.get(`/shifts/${id}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    .then(response => setShift(response.data))
    .catch(err => setError(err.response?.data?.message || "Could not load shift details"))
    .finally(() => setLoading(false));
  }, [id, userToken, user]);

  const getShiftStatus = () => {
    if (!shift) return "Unknown";
    
    const now = new Date();
    const shiftDate = new Date(shift.date);
    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    const [endHour, endMinute] = shift.finishTime.split(':').map(Number);
    
    const startTime = new Date(shiftDate.setHours(startHour, startMinute, 0, 0));
    const endTime = new Date(shiftDate.setHours(endHour, endMinute, 0, 0));
    
    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
    
    if (now < startTime) return "Scheduled";
    if (now <= endTime) return "In Progress";
    return "Completed";
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this shift?")) return;
    
    try {
      await axios.delete(`/shifts/${id}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      navigate("/shifts", { state: { deleted: true } });
    } catch {
      alert("Could not delete shift. Please try again.");
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );

  if (error || !shift) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error || "Shift not found"}</p>
          <button onClick={() => navigate("/shifts")} className="mt-4 text-blue-600 hover:underline">
            ← Back to Shifts
          </button>
        </div>
      </div>
    </div>
  );

  const status = getShiftStatus();
  const isActive = status === "In Progress";

  return (
    <div className="min-h-screen bg-gray-50">
      {justUpdated && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-center">
          Shift updated successfully!
        </div>
      )}
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button onClick={() => navigate("/shifts")} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Shift Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shift Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{shift.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive ? 'bg-orange-100 text-orange-800' : 
                  status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-gray-600 mb-6">{formatDate(shift.date)}</p>
              <div className="flex items-center text-gray-700">
                <span className="mr-2">🕒</span>
                <span className="font-medium">{shift.startTime} - {shift.finishTime}</span>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Location Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Location Name</p>
                  <p className="font-medium text-gray-900">{shift.location?.name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">{shift.location?.address || shift.location?.postCode || 'Address not available'}</p>
                </div>
                {distance !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-medium text-gray-900">
                      {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clock In/Out */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clock In/Out</h3>
              <p className="text-sm text-gray-600 mb-6">Manage your shift attendance</p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Clock In</span>
                    {isActive && <span className="text-xs text-green-600 font-medium">✓ 16:53:05</span>}
                  </div>
                  <button disabled={!isActive} className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isActive ? '✓ Clocked In' : 'Clock In'}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Clock Out</span>
                  </div>
                  <button disabled={!isActive} className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    isActive ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    Clock Out
                  </button>
                </div>

                {/* Status Messages */}
                {status === "Scheduled" && (
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-700">ℹ️ Clock in will be available when your shift begins</p>
                  </div>
                )}

                {isActive && (
                  <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Shift in progress</p>
                        <p className="text-xs text-orange-600 mt-1">Clock-out available 327 minutes before shift ends</p>
                      </div>
                      <div className="text-2xl">⏱️</div>
                    </div>
                  </div>
                )}

                {status === "Completed" && (
                  <div className="text-center py-4 opacity-60">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-gray-700 font-medium">Shift Completed</p>
                    <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                      {[
                        ['Clock In:', '16:53'],
                        ['Clock Out:', '22:05'],
                        ['Total Hours:', '5h 12m']
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-gray-700">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shift Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shift Management</h3>
              <p className="text-sm text-gray-600 mb-6">Administrative actions for this shift</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/shifts/${id}/edit`)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Edit Shift
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Delete Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}