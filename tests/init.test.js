const http = require('http');
const test = require('ava');
const got = require('got');

const app = require('../index');
const {authorsAuthorIdGET} = require('../service/DefaultService.js');

test.before(async (t) => {
	t.context.server = http.createServer(app);
    const server = t.context.server.listen();
    const { port } = server.address();
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}` });
});

test.after.always((t) => {
	t.context.server.close();
});

test("DELETE /authors/{authorId} returns correct response and status code", async (t) => {
    const { body, statusCode } = await t.context.got.delete('authors/0');
    t.is(statusCode, 200);
    t.deepEqual(body, '');
});

test("GET authors/{authorId} endpoint returns valid JSON content-type header", async (t) => {
    const { headers, statusCode } = await t.context.got("authors/0");
    t.is(statusCode, 200); // The status code should be 200
    t.is(headers["content-type"], "application/json"); // The content-type should be JSON
});

   test("PUT authors/{authorId} updates an author and returns valid JSON content-type", async (t) => {
    const { headers, statusCode } = await t.context.got.put("authors/0", {
        json: { name: "Updated Name" },
    });
    t.is(statusCode, 200);
    t.is(headers["content-type"].split(";")[0], "application/json");
});

test("POST authors/ creates a new author and returns valid JSON content-type", async (t) => {
    const response = await t.context.got.post("authors/", {
        json: { name: "New Author", id : "new id" }, // Δεδομένα που στέλνουμε
        responseType: "json" // Αυτόματα μετατρέπει την απάντηση σε JSON
    });

    t.is(response.statusCode, 200); // Πρέπει να επιστρέψει 200 Created
    t.is(response.headers["content-type"].split(";")[0], "application/json"); // Πρέπει να είναι JSON
    t.truthy(response.body.id); // Ο νέος συγγραφέας πρέπει να έχει ID
    t.is(response.body.name, "New Author"); // Πρέπει να επιστρέφει το όνομα σωστά
});

Για να μπορεί η put να εξετάσει περισσότερα πράγματα κανουμε την εξής αλλαγη 
exports.authorsAuthorIdPUT = function(body,authorId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "name" : "name",
  "id" : 0
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
} 
και γινεται 

exports.authorsAuthorIdPUT = function (body, authorId) {
  return new Promise(function (resolve, reject) {
    // Οι συγγραφείς ορίζονται μέσα στη συνάρτηση (κάθε κλήση ξεκινάει με αυτά τα δεδομένα)
    const authors = {
      0: { id: 0, name: "John Doe" },
      1: { id: 1, name: "Jane Smith" }
    };

    authorId = Number(authorId); // Μετατροπή του authorId σε αριθμό

    if (authors.hasOwnProperty(authorId)) {
      // Ενημέρωση του συγγραφέα
      authors[authorId].name = body.name;
      resolve(authors[authorId]); // Επιστρέφει το ενημερωμένο αντικείμενο
    } else {
      // Αν ο συγγραφέας δεν υπάρχει, επιστρέφουμε 404
      reject({ statusCode: 404, message: "Author not found" });
    }
  });
};  και παίρνουμε τα τεστ


// ✅ 1. Επιτυχής ενημέρωση συγγραφέα
test("PUT authors/{authorId} updates an author and returns valid JSON", async (t) => {
    const body = { name: "Updated Name" };
    const authorId = 0;

    const updatedAuthor = await authorsAuthorIdPUT(body, authorId);

    t.is(updatedAuthor.id, authorId); // Το ID πρέπει να είναι ίδιο
    t.is(updatedAuthor.name, "Updated Name"); // Το όνομα πρέπει να έχει αλλάξει
});

// ✅ 2. Προσπάθεια ενημέρωσης συγγραφέα που δεν υπάρχει
test("PUT authors/{authorId} returns 404 if author does not exist", async (t) => {
    const body = { name: "Non-Existent Author" };
    const authorId = 999; // ID που δεν υπάρχει

    await t.throwsAsync(async () => {
        await authorsAuthorIdPUT(body, authorId);
    }, { instanceOf: Object, message: "Author not found" });
});

// ✅ 3. Επαλήθευση ότι οι αλλαγές δεν αποθηκεύονται μεταξύ των κλήσεων
test("PUT authors/{authorId} does not persist changes between calls", async (t) => {
    const body = { name: "Temporary Name" };
    const authorId = 0;

    await authorsAuthorIdPUT(body, authorId); // Αλλάζουμε το όνομα

    // Κάνουμε ξανά PUT και ελέγχουμε αν ξεκινάει με τα αρχικά δεδομένα
    const originalAuthor = await authorsAuthorIdPUT({ name: "Another Name" }, authorId);

    t.not(originalAuthor.name, "Temporary Name"); // Το "Temporary Name" δεν πρέπει να υπάρχει
});
