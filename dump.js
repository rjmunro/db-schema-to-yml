#!/usr/bin/env node
/*jslint indent: 2*/
'use strict';

var
  yaml = require('js-yaml'),
  knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: process.argv[2]
    }
  }),
  tables = {},
  promise = knex.raw("SELECT name FROM sqlite_master WHERE type='table';"); // See: https://github.com/tgriesser/knex/issues/360#issuecomment-68387974

promise.then(function (results) {
  results.map(function (tablesRow) {
    promise = promise.then(function () {
      return knex(tablesRow.name).columnInfo().then(function (tableInfo) {
        //console.log(tablesRow.name, ":", tableInfo)
        tables[tablesRow.name] = tableInfo;
        return knex.raw('PRAGMA foreign_key_list("' + tablesRow.name + '")');
      }).then(function (foreignKeys) {
        foreignKeys.forEach(function (i) {
          delete i.id;
          tables[tablesRow.name][i.from].references = i
        });
      });
    });
  });
  promise.then(
    function () { console.log(yaml.safeDump({ tables: tables }, {sortKeys: true })); },
    function (error) { console.log("error:", error); }
  );
  return promise;
}).then(function () {
  process.exit(0);
});
