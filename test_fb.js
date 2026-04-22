import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB5oKSKMG89BOf7TWS4wpF2heRmphxwX34",
  authDomain: "lotericacentral-c7329.firebaseapp.com",
  databaseURL: "https://lotericacentral-c7329-default-rtdb.firebaseio.com",
  projectId: "lotericacentral-c7329"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

Promise.all([
  get(ref(db, "lc-cl")),
  get(ref(db, "lc-ops"))
]).then(([cl, ops]) => {
  console.log("=== FIREBASE STATE ===");
  console.log("CLIENTS (lc-cl):", cl.exists() ? (cl.val().length ? cl.val().length : cl.val()) : "EMPTY");
  console.log("OPS (lc-ops):", ops.exists() ? (ops.val().length ? ops.val().length : ops.val()) : "EMPTY");
  process.exit(0);
}).catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
