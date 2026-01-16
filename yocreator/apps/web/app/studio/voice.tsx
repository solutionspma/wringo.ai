"use client"
import axios from "axios";
import { useState } from "react";

export default function Voice() {
  const [text, setText] = useState("");
  const [job, setJob] = useState("");

  const submit = async () => {
    const res = await axios.post("http://localhost:5001/render/queue", {
      user_id: "test",
      type: "voice",
      payload: { text }
    });
    setJob(res.data.job_id);
  };

  return (
    <main className="p-10">
      <h1 className="text-3xl">Voice Generator</h1>
      <textarea onChange={e => setText(e.target.value)} className="mt-4 border p-4 w-full" />
      <button className="mt-4 bg-black text-white p-4" onClick={submit}>Generate</button>
      {job && <p className="mt-4">Job: {job}</p>}
    </main>
  );
}
