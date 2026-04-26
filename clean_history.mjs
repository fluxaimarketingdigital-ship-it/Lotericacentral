import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB5oKSKMG89BOf7TWS4wpF2heRmphxwX34",
  authDomain: "lotericacentral-c7329.firebaseapp.com",
  databaseURL: "https://lotericacentral-c7329-default-rtdb.firebaseio.com",
  projectId: "lotericacentral-c7329"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function run() {
  try {
    const snap = await get(ref(db, "lc-ops"));
    const ops = snap.val().data;
    const kassiaOp = ops.find(o => o.nome.toLowerCase().includes("kassia") || o.nome.toLowerCase().includes("kássia"));
    if (kassiaOp) {
      console.log("Kássia found in lc-ops!");
      console.log(JSON.stringify(kassiaOp, null, 2));
    } else {
      console.log("Kássia not found in lc-ops.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
