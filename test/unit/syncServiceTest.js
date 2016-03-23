import {merge} from '../../js/syncService';

var assert = require('assert');

describe('syncService', function() {
  describe('merge', function () {
    it('should fill localstorage from dropbox', function () {
      var sources = [
      [{id: 1, data: 'foo'}],
      []
      ];

      assert.deepEqual(merge(sources, null, true), sources[0]);
    });

    it('should fill dropbox from localstorage', function () {
      var sources = [
      [],
      [{id: 1, data: 'foo'}]
      ];

      assert.deepEqual(merge(sources, null, true), sources[1]);
    });

    it('should edit dropbox from localstorage', function () {
      var sources = [
      [
      {id: 1, data: 'bar'}
      ],
      [{id: 1, data: 'foo'}]
      ];

      assert.deepEqual(merge(sources, null, true), sources[1]);
    });
  });

  it('should return local collection if not initial sync', function () {
    var local =[{id: 1, data: 'foo'}];
    var sources = [undefined, null];

    assert.deepEqual(merge(sources, local, false), local);
  });
});
