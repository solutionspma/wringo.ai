"use client"
import { useState } from "react";
import axios from "axios";

export default function Avatar() {
  const [audio, setAudio] = useState<any>(null);
  const [image, setImage] = useState<any>(null);
  const [job, setJob] = useState("");

  const upload = async () => {
    const fd = new FormData();
    fd.append("audio", audio);
    fd.append("image", image);

    const r = await axios.post("http://localhost:5001/render/queue", {
      user_id: "test",
      type: "avatar",
      payload: { audio: "uploaded", image: "uploaded" }
    });

    setJob(r.data.job_id);
  };

  return (
    <main className="p-10">
      <h1 className="text-3xl">Avatar Builder</h1>
      <input type="file" onChange={e=>setAudio(e.target.files?.[0])} />
      <input type="file" onChange={e=>setImage(e.target.files?.[0])} />
      <button className="bg-black text-white p-4 mt-4" onClick={upload}>Generate</button>
      {job && <p>Job: {job}</p>}
    </main>
  );
}
