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
