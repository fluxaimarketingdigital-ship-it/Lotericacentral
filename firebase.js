import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB5oKSKMG89BOf7TWS4wpF2heRmphxwX34",
  authDomain: "lotericacentral-c7329.firebaseapp.com",
  databaseURL: "https://lotericacentral-c7329-default-rtdb.firebaseio.com",
  projectId: "lotericacentral-c7329",
  storageBucket: "lotericacentral-c7329.firebasestorage.app",
  messagingSenderId: "462305921835",
  appId: "1:462305921835:web:9e96787b831a48b20b136e"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const DB = {
  save: (k, v) => {
    try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
    set(ref(database, k), { _k: k, data: v }).catch(console.error);
  },
  load: async (k) => {
    try {
      const snapshot = await get(child(ref(database), k));
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const val = (raw && raw._k) ? (raw.data || (k==="lc-cfg"?null:[])) : raw;
        try { window.localStorage.setItem(k, JSON.stringify(val)); } catch (_) {}
        return val;
      } else {
        const local = window.localStorage.getItem(k);
        if (local) {
          const parsed = JSON.parse(local);
          set(ref(database, k), { _k: k, data: parsed });
          return parsed;
        }
      }
    } catch (e) {
      console.error("Firebase Error:", e);
    }
    return k === "lc-cfg" ? null : [];
  },
  listen: (k, callback) => {
    return onValue(ref(database, k), (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const val = (raw && raw._k) ? (raw.data || (k==="lc-cfg"?null:[])) : raw;
        try { window.localStorage.setItem(k, JSON.stringify(val)); } catch (_) {}
        callback(val);
      } else {
        callback(k === "lc-cfg" ? null : []);
      }
    });
  }
};
