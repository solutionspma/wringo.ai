"use client"
import { useState } from "react";
import axios from "axios";

export default function Video() {
  const [scenes, setScenes] = useState<any[]>([]);
  const [image, setImage] = useState<any>(null);
  const [duration, setDuration] = useState(5);
  const [job, setJob] = useState("");

  const addScene = () => {
    setScenes([...scenes, { image, duration }]);
  };

  const submit = async () => {
    const r = await axios.post("http://localhost:5001/render/queue", {
      user_id: "test",
      type: "video",
      payload: { scenes }
    });
    setJob(r.data.job_id);
  };

  return (
    <main className="p-10">
      <h1 className="text-3xl">Video Creator</h1>

      <input type="file" onChange={e=>setImage(e.target.files?.[0])} />
      <input type="number" value={duration} onChange={e=>setDuration(parseInt(e.target.value))} />

      <button className="bg-gray-800 text-white p-3 mt-4" onClick={addScene}>
        Add Scene
      </button>

      <button className="bg-black text-white p-4 mt-4" onClick={submit}>
        Render Video
      </button>

      {job && <p className="mt-4">Job: {job}</p>}
    </main>
  );
}
