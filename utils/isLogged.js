import firebase from './Firebase';

export default function isLogged() {
    return firebase.getAuth();
};
