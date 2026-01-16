import axios from "axios";

const API_BASE = "http://localhost:5001";

export const api = {
  queueRender: (type: string, payload: any) =>
    axios.post(`${API_BASE}/render/queue`, { user_id: "test", type, payload }),
  
  getJob: (id: string) =>
    axios.get(`${API_BASE}/jobs/${id}`),
  
  getUserJobs: (uid: string) =>
    axios.get(`${API_BASE}/jobs/user/${uid}`)
};
