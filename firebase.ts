
export const auth = {
  currentUser: null,
  onAuthStateChanged: (cb: any) => { cb(null); return () => {}; },
  signInWithPopup: async () => { throw new Error("Firebase is not configured."); },
  signOut: async () => {}
};

export const onAuthStateChanged = (auth: any, cb: any) => { cb(null); return () => {}; };
export const signInWithPopup = async () => { throw new Error("Firebase is not configured."); };
export const signOut = async () => {};

export const googleProvider = {};

export const db = {};

export const collection = () => ({});
export const addDoc = async () => ({ id: 'mock-id' });
export const doc = () => ({});
export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
export const setDoc = async () => {};
export const updateDoc = async () => {};
export const query = () => ({});
export const where = () => ({});
export const getDocs = async () => {
  const mockSnapshot = {
    forEach: (cb: any) => {}
  };
  return mockSnapshot;
};
export const orderBy = () => ({});
export const limit = () => ({});
export const getDocFromServer = async () => ({ exists: () => false, data: () => ({}) });

export const analytics = null;
