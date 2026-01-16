"use client"
import { useEffect, useState } from "react";
import axios from "axios";

export default function RenderStatus({ job }: { job: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!job) return;

    const inter = setInterval(async () => {
      const r = await axios.get(`/api/job/${job}`);
      setData(r.data);
    }, 2000);

    return () => clearInterval(inter);
  }, [job]);

  if (!data) return <p>Waiting…</p>;

  return (
    <div className="p-4 border mt-4">
      <p>Status: {data.status}</p>
      {data.result_url && (
        <a
          href={data.result_url}
          target="_blank"
          className="text-blue-600 underline"
        >
          Download Video
        </a>
      )}
      {data.error && <p className="text-red-600">{data.error}</p>}
    </div>
  );
}
