import { auth, db } from "./firebase-config.js";
import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	updateProfile,
	signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
	collection, 
	doc, 
	setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function onAuthReady() {
	return new Promise(resolve => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			unsubscribe();
			resolve(user);
		});
	});
}

export function watchAuthState(callback) {
	return onAuthStateChanged(auth, callback);
}

export async function loginUser(email, password) {
	return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(name, email, password) {
	const result = await createUserWithEmailAndPassword(auth, email, password);
	if (name) {
		await updateProfile(result.user, { displayName: name });
	}
	
	// Save user data to Firestore
	await setDoc(doc(db, "users", result.user.uid), {
		name: name || "",
		email: email,
		createdAt: new Date()
	});
	
	return result;
}

export async function logoutUser() {
	return signOut(auth);
}
