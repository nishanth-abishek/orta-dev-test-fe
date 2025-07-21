import React, { useEffect, useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "../../Axios/axios";
import TokenContext from "../../context/TokenContext";

// Validation schema
const schema = yup
  .object({
    title: yup.string().required("Title is required"),
    role: yup.string().required("Role is required"),
    locationId: yup.string().required("Location is required"),
    address: yup.string().required("Address is required"),
    latitude: yup
      .number()
      .typeError("Latitude must be a number")
      .required("Latitude is required"),
    longitude: yup
      .number()
      .typeError("Longitude must be a number")
      .required("Longitude is required"),
    date: yup.date().required("Date is required"),
    startTime: yup
      .string()
      .matches(/^\d{2}:\d{2}$/, "Must be HH:mm")
      .required("Start time is required"),
    finishTime: yup
      .string()
      .matches(/^\d{2}:\d{2}$/, "Must be HH:mm")
      .required("Finish time is required"),
  })
  .required();

export default function EditShift() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userToken, user } = useContext(TokenContext);
  const [locations, setLocations] = useState([]);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: "",
      role: "",
      locationId: "",
      address: "",
      latitude: "",
      longitude: "",
      date: "",
      startTime: "",
      finishTime: "",
      duration: "",
    }
  });

  // Load cached locations and fetch unique list via shifts
  useEffect(() => {
    const cache = localStorage.getItem("locationsCache");
    if (cache) setLocations(JSON.parse(cache));
    axios
      .get("/shifts", { params: { userId: user._id }, headers: { Authorization: `Bearer ${userToken}` } })
      .then(res => {
        const uniq = [];
        const seen = new Set();
        res.data.forEach(s => {
          const loc = s.location;
          if (loc?._id && !seen.has(loc._id)) {
            seen.add(loc._id);
            uniq.push(loc);
          }
        });
        setLocations(uniq);
        localStorage.setItem("locationsCache", JSON.stringify(uniq));
      })
      .catch(() => {});
  }, [userToken, user._id]);

  // Load shift data
  useEffect(() => {
    (async () => {
      try {
        const { data: s } = await axios.get(`/shifts/${id}`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        // Correct date for input
        const dt = new Date(s.date);
        const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
        const yyyyMmDd = local.toISOString().split("T")[0];
        // Address line
        const addrLine = [
          s.location.constituency,
          s.location.adminDistrict,
          s.location.postCode
        ].filter(Boolean).join(", ");
        reset({
          title: s.title,
          role: s.role,
          locationId: s.location._id,
          address: addrLine,
          latitude: s.location.cordinates.latitude,
          longitude: s.location.cordinates.longitude,
          date: yyyyMmDd,
          startTime: s.startTime,
          finishTime: s.finishTime,
          duration: "",
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id, userToken, reset]);

  // Auto-fill address & coords on location change
  const selectedId = watch("locationId");
  useEffect(() => {
    if (selectedId) {
      const loc = locations.find(l => l._id === selectedId);
      if (loc) {
        const addr = [loc.constituency, loc.adminDistrict, loc.postCode].filter(Boolean).join(", ");
        setValue("address", addr);
        setValue("latitude", loc.cordinates.latitude);
        setValue("longitude", loc.cordinates.longitude);
      }
    }
  }, [selectedId, locations, setValue]);

  // Calculate duration
  const start = watch("startTime");
  const finish = watch("finishTime");
  useEffect(() => {
    if (!start || !finish) return setValue("duration", "");
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = finish.split(":").map(Number);
    let diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff < 0) diff += 1440;
    setValue("duration", `${Math.floor(diff/60)}h ${diff%60}m`);
  }, [start, finish, setValue]);

  const onSubmit = async data => {
    try {
      await axios.put(
        `/shifts/${id}`,
        {
          title: data.title,
          role: data.role,
          date: data.date,
          startTime: data.startTime,
          finishTime: data.finishTime,
          user: user._id,
          location: data.locationId,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      navigate(`/shifts/${id}`, { state: { updated: true } });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Edit Shift Details</h1>
          <p className="text-gray-600">Update the shift information below.</p>
        </div>

        {state?.updated && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded">
            Shift updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium">Shift Title *</label>
                <input {...register("title")} className="w-full border px-3 py-2 rounded" />
                {errors.title && <p className="text-red-600">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block font-medium">Role *</label>
                <input {...register("role")} className="w-full border px-3 py-2 rounded" />
                {errors.role && <p className="text-red-600">{errors.role.message}</p>}
              </div>
            </div>
          </section>

          {/* Location Details */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">📍 Location Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium">Location *</label>
                <select {...register("locationId")} className="w-full border px-3 py-2 rounded">
                  <option value="">Select Location</option>
                  {locations.map(l => (
                    <option key={l._id} value={l._id}>{l.name || l.postCode}</option>
                  ))}
                </select>
                {errors.locationId && <p className="text-red-600">{errors.locationId.message}</p>}
              </div>
              <div>
                <label className="block font-medium">Address *</label>
                <textarea {...register("address")} rows={2} className="w-full border px-3 py-2 rounded" />
                {errors.address && <p className="text-red-600">{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium">Latitude *</label>
                  <input {...register("latitude")} className="w-full border px-3 py-2 rounded" />
                  {errors.latitude && <p className="text-red-600">{errors.latitude.message}</p>}
                </div>
                <div>
                  <label className="block font-medium">Longitude *</label>
                  <input {...register("longitude")} className="w-full border px-3 py-2 rounded" />
                  {errors.longitude && <p className="text-red-600">{errors.longitude.message}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Schedule Details */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">🕒 Schedule Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium">Date *</label>
                <input type="date" {...register("date")} className="w-full border px-3 py-2 rounded" />
                {errors.date && <p className="text-red-600">{errors.date.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium">Start Time *</label>
                  <input type="time" step="60" {...register("startTime")} className="w-full border px-3 py-2 rounded" />
                  {errors.startTime && <p className="text-red-600">{errors.startTime.message}</p>}
                </div>
                <div>
                  <label className="block font-medium">Finish Time *</label>
                  <input type="time" step="60" {...register("finishTime")} className="w-full border px-3 py-2 rounded" />
                  {errors.finishTime && <p className="text-red-600">{errors.finishTime.message}</p>}
                </div>
              </div>
              {watch("duration") && (
                <div className="text-sm text-gray-600">
                  Duration: <span className="font-medium">{watch("duration")}</span>
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => navigate(`/shifts/${id}`)} className="px-6 py-2 border rounded">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-gray-900 text-white rounded disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Update Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
