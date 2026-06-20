import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Metric {
  id: string;
  teamId: string;
  timestamp: number;
  tasksCompleted: number;
  activeMembers: number;
  responseTime: number;
  throughput: number;
  isAggregated?: boolean;
  createdAt?: Date;
}

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  role: "Admin" | "TeamLeader" | "Member";
  teams?: string[];
  createdAt?: Date;
}

/**
 * Get all teams (admin only) or user's teams
 */
export async function getTeams(
  userRole: string,
  userTeams?: string[]
): Promise<Team[]> {
  try {
    const teamsRef = collection(db, "teams");
    let q;

    if (userRole === "Admin") {
      // Admins see all teams
      q = query(teamsRef, orderBy("name"));
    } else {
      // Non-admins see only their teams
      if (!userTeams || userTeams.length === 0) {
        return [];
      }
      q = query(teamsRef, where("__name__", "in", userTeams));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.(),
    } as Team));
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw error;
  }
}

/**
 * Get metrics for a team within a time range
 */
export async function getTeamMetrics(
  teamId: string,
  startTime: number,
  endTime: number
): Promise<Metric[]> {
  try {
    const metricsRef = collection(db, "teams", teamId, "metrics");
    const q = query(
      metricsRef,
      where("timestamp", ">=", startTime),
      where("timestamp", "<=", endTime),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      teamId,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
    } as Metric));
  } catch (error) {
    console.error("Error fetching team metrics:", error);
    throw error;
  }
}

/**
 * Subscribe to real-time metrics for a team
 */
export function subscribeToRealtimeMetrics(
  teamId: string,
  callback: (metric: Metric | null) => void
): () => void {
  try {
    const metricsRef = doc(db, "teams", teamId, "realtimeMetrics", "current");

    const unsubscribe = onSnapshot(metricsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          id: snapshot.id,
          teamId,
          ...data,
          createdAt: data.createdAt?.toDate?.(),
        } as Metric);
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to real-time metrics:", error);
    throw error;
  }
}

/**
 * Get aggregated metrics for a team
 */
export async function getAggregatedMetrics(
  teamId: string,
  startTime: number,
  endTime: number
): Promise<Metric[]> {
  try {
    const metricsRef = collection(db, "teams", teamId, "metrics");
    const q = query(
      metricsRef,
      where("timestamp", ">=", startTime),
      where("timestamp", "<=", endTime),
      where("isAggregated", "==", true),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      teamId,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
    } as Metric));
  } catch (error) {
    console.error("Error fetching aggregated metrics:", error);
    throw error;
  }
}

/**
 * Create a new metric (typically done by Cloud Functions)
 */
export async function createMetric(
  teamId: string,
  metric: Omit<Metric, "id" | "createdAt">
): Promise<string> {
  try {
    const metricsRef = collection(db, "teams", teamId, "metrics");
    const docRef = await addDoc(metricsRef, {
      ...metric,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating metric:", error);
    throw error;
  }
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string): Promise<User[]> {
  try {
    const membersRef = collection(db, "teams", teamId, "members");
    const snapshot = await getDocs(membersRef);

    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
    } as User));
  } catch (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }
}

/**
 * Get user's teams
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return [];
    }

    const teamIds = userSnap.data().teams || [];
    if (teamIds.length === 0) {
      return [];
    }

    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("__name__", "in", teamIds));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.(),
    } as Team));
  } catch (error) {
    console.error("Error fetching user teams:", error);
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return {
      uid: userSnap.id,
      ...userSnap.data(),
      createdAt: userSnap.data().createdAt?.toDate?.(),
    } as User;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}
