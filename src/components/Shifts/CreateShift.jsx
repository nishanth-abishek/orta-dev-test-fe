import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import axios from "../../Axios/axios";
import TokenContext from "../../context/TokenContext";

// Validation schema
const schema = yup
  .object({
    title: yup.string().required("Title is required"),
    role: yup.string().required("Role is required"),
    locationId: yup.string().nullable(),
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

export default function CreateShift() {
  const { userToken, user } = useContext(TokenContext);
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: "",
      role: "",
      locationId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      finishTime: "17:00",
      duration: "",
      address: "",
      latitude: "",
      longitude: "",
    },
  });

  // Load cached locations & fetch fresh
  useEffect(() => {
    const cache = localStorage.getItem("locationsCache");
    if (cache) setLocations(JSON.parse(cache));
    axios
      .get("/shifts", { params: { userId: user._id }, headers: { Authorization: `Bearer ${userToken}` } })
      .then(res => {
        const uniq = [];
        const seen = new Set();
        res.data.forEach(s => {
          const l = s.location;
          if (l?._id && !seen.has(l._id)) {
            seen.add(l._id);
            uniq.push(l);
          }
        });
        setLocations(uniq);
        localStorage.setItem("locationsCache", JSON.stringify(uniq));
      })
      .catch(() => {});
  }, [userToken, user._id]);

  // Auto-fill address
  const selectedId = watch("locationId");
  useEffect(() => {
    if (selectedId) {
      const loc = locations.find(l => l._id === selectedId);
      if (loc) {
        const addr = [loc.constituency, loc.adminDistrict, loc.postCode]
          .filter(Boolean)
          .join(", ");
        setValue("address", addr);
        setValue("latitude", loc.cordinates.latitude);
        setValue("longitude", loc.cordinates.longitude);
      }
    } else {
      ["address", "latitude", "longitude"].forEach(field => setValue(field, ""));
    }
  }, [selectedId, locations, setValue]);

  // Recalculate duration
  const start = watch("startTime");
  const finish = watch("finishTime");
  useEffect(() => {
    if (!start || !finish) return setValue("duration", "");
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = finish.split(":").map(Number);
    let diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    setValue("duration", `${Math.floor(diff/60)}h ${diff%60}m`);
  }, [start, finish, setValue]);

  const onSubmit = async data => {
    try {
      const day = new Date(data.date).getDay();
      const type = [0,6].includes(day) ? ["Weekends"] : ["Weekdays"];
      await axios.post(
        "/shifts",
        { ...{
          title: data.title,
          role: data.role,
          typeOfShift: type,
          numOfShiftsPerDay: 1,
          date: data.date,
          startTime: data.startTime,
          finishTime: data.finishTime,
          user: user._id,
          location: data.locationId || undefined,
        }},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      navigate("/shifts", { state: { created: true } });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 space-y-8">
        {/* Header Card */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Create a Shift</h1>
          <p className="text-gray-600">Fill out the details below to schedule your next shift.</p>
        </div>

        <form id="create-shift-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium">Title *</label>
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
                <label className="block font-medium">Location</label>
                <select {...register("locationId")} className="w-full border px-3 py-2 rounded">
                  <option value="">-- New Location --</option>
                  {locations.map(l => (
                    <option key={l._id} value={l._id}>{l.name || l.postCode}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium">Address</label>
                <textarea {...register("address")} rows={2} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium">Latitude</label>
                  <input {...register("latitude")} className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="block font-medium">Longitude</label>
                  <input {...register("longitude")} className="w-full border px-3 py-2 rounded" />
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
            <button type="button" onClick={() => navigate("/shifts")} className="px-6 py-2 border rounded">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-gray-900 text-white rounded disabled:opacity-50">
              {isSubmitting ? "Creating..." : "Create Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}