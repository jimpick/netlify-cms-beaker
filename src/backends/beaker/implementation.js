import semaphore from "semaphore";
import AuthenticationPage from './AuthenticationPage';
import { fileExtension } from '../../lib/pathHelper';

const MAX_CONCURRENT_DOWNLOADS = 10;

const origin = document.location.origin;
const archive = new DatArchive(document.location.origin);

function nameFromEmail(email) {
  return email
    .split('@').shift().replace(/[.-_]/g, ' ')
    .split(' ')
    .filter(f => f)
    .map(s => s.substr(0, 1).toUpperCase() + (s.substr(1) || ''))
    .join(' ');
}

export default class TestRepo {
  constructor(config) {
    this.config = config;
  }

  setUser() {}

  authComponent() {
    return AuthenticationPage;
  }

  authenticate(state) {
    return Promise.resolve({ email: state.email, name: nameFromEmail(state.email) });
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  entriesByFolder(collection, extension) {
    const entries = [];
    const folder = collection.get('folder');
    const promise = archive.readdir(folder)
      .then(files => files.filter(file => fileExtension(file) === extension))
      .then(this.fetchFiles(folder));
    return promise
  }

  entriesByFiles(collection) {
    /* FIXME */
  }

  fetchFiles = (folder) => (files) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => {
        const path = `${folder}/${file}`
        return sem.take(() => archive.readFile(path).then((data) => {
          resolve({
            file: {
              name: file,
              path
            },
            data
          });
          sem.leave();
        }).catch((err) => {
          sem.leave();
          reject(err);
        }))
      }));
    });
    return Promise.all(promises);
  }

  getEntry(collection, slug, path) {
    return archive.readFile(path).then(data => ({ file: { path }, data }));
  }

  persistEntry(entry, mediaFiles = [], options) {
    // FIXME: Might not work if directory doesn't exist
    const promise = archive.writeFile(entry.path, entry.raw)
      .then(() => { archive.commit() });
    return promise;
  }

  deleteFile(path, commitMessage) {
    const promise = archive.unlink(path)
      .then(() => { archive.commit() });
    return promise;
  }
}
