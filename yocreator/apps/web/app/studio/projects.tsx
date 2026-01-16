"use client"
import { useEffect, useState } from "react";
import axios from "axios";

export default function Projects() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5001/jobs/user/test")
      .then(r => setJobs(r.data));
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-3xl">My Projects</h1>
      <ul className="mt-4">
        {jobs.map((j: any) => (
          <li key={j.id} className="p-4 border-b">
            <p>Type: {j.type}</p>
            <p>Status: {j.status}</p>
            {j.result_url && <a className="text-blue-600 underline" href={j.result_url} target="_blank">Download</a>}
          </li>
        ))}
      </ul>
    </main>
  );
}
