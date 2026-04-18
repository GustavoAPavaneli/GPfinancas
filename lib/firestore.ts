import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Trip, Expense } from "./types";

type Unsubscribe = () => void;

export function subscribeTrips(uid: string, cb: (trips: Trip[]) => void): Unsubscribe {
  const q = query(collection(db, "users", uid, "trips"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Trip, "id">) })));
  });
}

export async function addTrip(uid: string, trip: Omit<Trip, "id">): Promise<void> {
  const data: Record<string, unknown> = { createdAt: Timestamp.now() };
  for (const [k, v] of Object.entries(trip)) {
    if (v !== undefined) data[k] = v;
  }
  await addDoc(collection(db, "users", uid, "trips"), data);
}

export async function removeTrip(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "trips", id));
}

export function subscribeExpenses(uid: string, cb: (expenses: Expense[]) => void): Unsubscribe {
  const q = query(collection(db, "users", uid, "expenses"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, "id">) })));
  });
}

export async function addExpense(uid: string, expense: Omit<Expense, "id">): Promise<void> {
  const data: Record<string, unknown> = { createdAt: Timestamp.now() };
  for (const [k, v] of Object.entries(expense)) {
    if (v !== undefined) data[k] = v;
  }
  await addDoc(collection(db, "users", uid, "expenses"), data);
}

export async function removeExpense(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "expenses", id));
}
