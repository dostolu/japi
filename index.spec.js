/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const assert = require('chai').assert;
const japi = require('./index');

describe('japi', () => {
  function basicTests(jsendInstance) {
    describe('- isValid', () => {
      describe('should validate', () => {
        describe('"success" status', () => {
          it('with object data', () => {
            assert(jsendInstance.isValid({
              status: 'success',
              data: { foo: 'bar' }
            }));
          });

          it('with array data', () => {
            assert(jsendInstance.isValid({
              status: 'success',
              data: [1, 2, 3]
            }));
          });

          it('with null data', () => {
            assert(jsendInstance.isValid({
              status: 'success',
              data: null
            }));
          });

          it('with meta data', () => {
            assert(jsendInstance.isValid({
              status: 'success',
              data: null,
              meta: [1, 2, 3]
            }));
          });
        });

        describe('"fail" status', () => {
          it('with object data', () => {
            assert(jsendInstance.isValid({
              status: 'fail',
              data: { foo: 'bar' }
            }));
          });

          it('with array data', () => {
            assert(jsendInstance.isValid({
              status: 'fail',
              data: [1, 2, 3]
            }));
          });

          it('with null data', () => {
            assert(jsendInstance.isValid({
              status: 'fail',
              data: null
            }));
          });
        });

        describe('"error" status', () => {
          it('with a message', () => {
            assert(jsendInstance.isValid({
              status: 'error',
              message: 'something is wrong'
            }));
          });

          it('with a message and a code', () => {
            assert(jsendInstance.isValid({
              status: 'error',
              message: 'something is wrong',
              code: 123
            }));
          });

          it('with a message and data', () => {
            assert(jsendInstance.isValid({
              status: 'error',
              message: 'something is wrong',
              data: { stack: 'this -> that -> the other' }
            }));
          });

          it('with a message, a code, and data', () => {
            assert(jsendInstance.isValid({
              status: 'error',
              message: 'something is wrong',
              code: 123,
              data: { stack: 'this -> that -> the other' }
            }));
          });
        });
      });

      describe('should invalidate', () => {
        it('object with no status', () => {
          assert.isFalse(jsendInstance.isValid({
            data: { foo: 'bar' }
          }));
        });

        it('"success" status without data', () => {
          assert.isFalse(jsendInstance.isValid({
            status: 'success'
          }));
        });

        it('"fail" status without data', () => {
          assert.isFalse(jsendInstance.isValid({
            status: 'fail'
          }));
        });

        it('"error" status without message', () => {
          assert.isFalse(jsendInstance.isValid({
            status: 'error',
            data: { foo: 'bar' }
          }));
        });
      });
    });

    describe('- fromArguments', () => {
      describe('should generate "success"', () => {
        it('with object data', () => {
          const json = { status: 'success', data: { foo: 'bar' } };
          assert.deepEqual(jsendInstance.fromArguments(null, json.data), json);
        });

        it('with array data', () => {
          const json = { status: 'success', data: [1, 2, 3] };
          assert.deepEqual(jsendInstance.fromArguments(null, json.data), json);
        });

        it('with string data', () => {
          const json = { status: 'success', data: 'you got it' };
          assert.deepEqual(jsendInstance.fromArguments(null, json.data), json);
        });

        it('with numeric data', () => {
          const json = { status: 'success', data: 123 };
          assert.deepEqual(jsendInstance.fromArguments(null, json.data), json);
        });

        it('with null data', () => {
          const json = { status: 'success', data: null };
          assert.deepEqual(jsendInstance.fromArguments(null, json.data), json);
        });

        it('with meta data', () => {
          const json = { status: 'success', data: 'some data', meta: 'metadata' };
          assert.deepEqual(jsendInstance.fromArguments(null, json.data, json.meta), json);
        });
      });

      describe('should generate "error"', () => {
        it('with error message as first arg', () => {
          const json = { status: 'error', message: 'something bad' };
          assert.deepEqual(jsendInstance.fromArguments(json.message), json);
        });

        it('with Error object as first arg', () => {
          const json = { status: 'error', message: 'something bad' };
          const output = jsendInstance.fromArguments(new Error(json.message));
          assert.isObject(output.data);
          assert.isString(output.data.stack);
          delete output.data;
          assert.deepEqual(output, json);
        });

        it('with japi error object as first arg', () => {
          const json = { status: 'error', message: 'something bad' };
          assert.deepEqual(jsendInstance.fromArguments(json), json);
        });

        it('with japi fail object as first arg', () => {
          const json = { status: 'fail', data: { something: 'bad' } };
          assert.deepEqual(jsendInstance.fromArguments(json),
            { status: 'error', message: 'Unknown error. (japi)' });
        });

        it('with japi fail object as first arg and preserve message', () => {
          const json = { status: 'fail', data: { something: 'bad' }, message: 'Really bad!' };
          assert.deepEqual(jsendInstance.fromArguments(json),
            { status: 'error', message: 'Really bad!' });
        });

        it('with japi success object as first arg', () => {
          const json = { status: 'success', data: { something: 'bad' } };
          assert.deepEqual(jsendInstance.fromArguments(json),
            { status: 'error', message: 'Unknown error. (japi)' });
        });
      });
    });

    describe('- forward', () => {
      function assertCall(expectedErr, expectedData) {
        return (err, data) => {
          if (expectedErr) {
            assert.typeOf(err, 'error');
            assert.isString(err.message);
            if (expectedErr.message) assert.equal(err.message, expectedErr.message);
            if (expectedErr.code) assert.equal(err.code, expectedErr.code);
          }

          if (expectedData !== undefined) {
            assert.deepEqual(data, expectedData);
          }
        };
      }

      describe('for "success"', () => {
        it('should pass object data', () => {
          const json = { status: 'success', data: { foo: 'bar' } };
          jsendInstance.forward(json, assertCall(null, json.data));
        });

        it('should pass array data', () => {
          const json = { status: 'success', data: [1, 2, 3] };
          jsendInstance.forward(json, assertCall(null, json.data));
        });

        it('should pass string data', () => {
          const json = { status: 'success', data: 'you got it' };
          jsendInstance.forward(json, assertCall(null, json.data));
        });

        it('should pass numeric data', () => {
          const json = { status: 'success', data: 123 };
          jsendInstance.forward(json, assertCall(null, json.data));
        });

        it('should pass null data', () => {
          const json = { status: 'success', data: null };
          jsendInstance.forward(json, assertCall(null, json.data));
        });
      });

      describe('for "fail"', () => {
        it('should pass an error and data', () => {
          const json = { status: 'fail', data: { validation: false } };
          jsendInstance.forward(json, assertCall(true, json.data));
        });
      });

      describe('for "error"', () => {
        it('should pass an error', () => {
          const json = { status: 'error', message: 'something bad' };
          jsendInstance.forward(json, assertCall(json));
        });

        it('with code should pass an error with code', () => {
          const json = { status: 'error', message: 'something bad', code: 123 };
          jsendInstance.forward(json, assertCall(json));
        });

        it('with data should pass the data', () => {
          const json = {
            status: 'error',
            message: 'something bad',
            code: 123,
            data: { foo: 'bar' }
          };
          jsendInstance.forward(json, assertCall(json, json.data));
        });
      });

      describe('for invalid japi responses', () => {
        it('passes string responses back as the error message', () => {
          const html = '<html><body>414 Request-URI Too Large</body></html>';
          jsendInstance.forward(html, (err, data) => {
            assert.equal(err.data.originalObject, html);
          });
        });

        it('passes object responses back as the error message', () => {
          const html = { 'invalid-jsend': true };
          jsendInstance.forward(html, (err, data) => {
            assert.equal(err.data.originalObject['invalid-jsend'], html['invalid-jsend']);
          });
        });
      });
    });

    describe('- success', () => {
      it('with japi object', () => {
        const json = { status: 'success', data: { foo: 'bar' } };

        assert.deepEqual(json, jsendInstance.success(json));
      });

      it('with object data', () => {
        const json = { status: 'success', data: { foo: 'bar' } };

        assert.deepEqual(json, jsendInstance.success(json.data));
      });

      it('with array data', () => {
        const json = { status: 'success', data: [1, 2, 3] };

        assert.deepEqual(json, jsendInstance.success(json.data));
      });

      it('with string data', () => {
        const json = { status: 'success', data: 'you got it' };

        assert.deepEqual(json, jsendInstance.success(json.data));
      });

      it('with numeric data', () => {
        const json = { status: 'success', data: 123 };

        assert.deepEqual(json, jsendInstance.success(json.data));
      });

      it('with null data', () => {
        const json = { status: 'success', data: null };

        assert.deepEqual(json, jsendInstance.success(json.data));
      });

      it('should throw error with no data', () => {
        assert.throws(jsendInstance.success);
      });
    });

    describe('- fail', () => {
      it('with japi object', () => {
        const json = { status: 'fail', data: { foo: 'bar' } };

        assert.deepEqual(json, jsendInstance.fail(json));
      });

      it('with object data', () => {
        const json = { status: 'fail', data: { foo: 'bar' } };

        assert.deepEqual(json, jsendInstance.fail(json.data));
      });

      it('with array data', () => {
        const json = { status: 'fail', data: [1, 2, 3] };

        assert.deepEqual(json, jsendInstance.fail(json.data));
      });

      it('with string data', () => {
        const json = { status: 'fail', data: 'you got it' };

        assert.deepEqual(json, jsendInstance.fail(json.data));
      });

      it('with numeric data', () => {
        const json = { status: 'fail', data: 123 };

        assert.deepEqual(json, jsendInstance.fail(json.data));
      });

      it('with null data', () => {
        const json = { status: 'fail', data: null };

        assert.deepEqual(json, jsendInstance.fail(json.data));
      });

      it('should throw error with no data', () => {
        assert.throws(jsendInstance.fail);
      });
    });

    describe('- error', () => {
      it('with message', () => {
        const json = { status: 'error', message: 'something bad' };

        assert.deepEqual(json, jsendInstance.error(json.message));
      });

      it('with message and code', () => {
        const json = { status: 'error', message: 'something bad', code: 'BAD_THINGS' };

        assert.deepEqual(json, jsendInstance.error(json));
      });

      it('with message and data', () => {
        const json = { status: 'error', message: 'something bad', data: { foo: 'bar' } };

        assert.deepEqual(json, jsendInstance.error(json));
      });

      it('with message and data and code', () => {
        const json =
        { status: 'error', message: 'something bad', code: 'BAD_THINGS', data: { foo: 'bar' } };
        assert.deepEqual(json, jsendInstance.error(json));
      });

      it('should throw error with no message', () => {
        const json = { status: 'error', code: 'BAD_THINGS', data: { foo: 'bar' } };

        assert.throws(jsendInstance.error.bind(jsendInstance, json));
      });
    });

    describe('- middleware', () => {
      const req = {};

      it('should call "next" callback', done => {
        jsendInstance.middleware({}, {}, done);
      });

      describe('should respond with "error"', () => {
        it('with error message as first arg', done => {
          const json = { status: 'error', message: 'something bad' };
          const res = {
            json: output => {
              assert.deepEqual(output, { status: 'error', message: 'something bad' });
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(json.message);
          });
        });

        it('with Error object as first arg', done => {
          const json = { status: 'error', message: 'something bad' };
          const res = {
            json: output => {
              assert.isObject(output.data);
              assert.isString(output.data.stack);
              delete output.data;
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(new Error(json.message));
          });
        });

        it('with japi error object as first arg', done => {
          const json = { status: 'error', message: 'something bad' };
          const res = {
            json: output => {
              assert.deepEqual(jsendInstance.fromArguments(json), json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(json);
          });
        });

        it('with japi fail object as first arg', done => {
          const json = { status: 'fail', data: { something: 'bad' } };
          const res = {
            json: output => {
              assert.deepEqual(jsendInstance.fromArguments(json),
                { status: 'error', message: 'Unknown error. (japi)' });
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(json);
          });
        });

        it('with japi fail object as first arg and preserve message', done => {
          const json = { status: 'fail', data: { something: 'bad' }, message: 'Really bad!' };
          const res = {
            json: output => {
              assert.deepEqual(jsendInstance.fromArguments(json),
                { status: 'error', message: 'Really bad!' });
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(json);
          });
        });

        it('with japi success object as first arg', done => {
          const json = { status: 'success', data: { something: 'bad' } };
          const res = {
            json: output => {
              assert.deepEqual(jsendInstance.fromArguments(json),
                { status: 'error', message: 'Unknown error. (japi)' });
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(json);
          });
        });
      });

      describe('should respond with "success"', () => {
        it('with japi object', done => {
          const json = { status: 'success', data: { foo: 'bar' } };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(null, json);
          });
        });

        it('with object data', done => {
          const json = { status: 'success', data: { foo: 'bar' } };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(null, json.data);
          });
        });

        it('with array data', done => {
          const json = { status: 'success', data: [1, 2, 3] };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(null, json.data);
          });
        });

        it('with string data', done => {
          const json = { status: 'success', data: 'you got it' };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(null, json.data);
          });
        });

        it('with numeric data', done => {
          const json = { status: 'success', data: 123 };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(null, json.data);
          });
        });

        it('with null data', done => {
          const json = { status: 'success', data: null };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend(null, json.data);
          });
        });
      });

      describe('.success method', () => {
        it('with japi object', done => {
          const json = { status: 'success', data: { foo: 'bar' } };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.success(json);
          });
        });

        it('with object data', done => {
          const json = { status: 'success', data: { foo: 'bar' } };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.success(json.data);
          });
        });

        it('with array data', done => {
          const json = { status: 'success', data: [1, 2, 3] };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.success(json.data);
          });
        });

        it('with string data', done => {
          const json = { status: 'success', data: 'you got it' };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.success(json.data);
          });
        });

        it('with numeric data', done => {
          const json = { status: 'success', data: 123 };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.success(json.data);
          });
        });

        it('with null data', done => {
          const json = { status: 'success', data: null };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.success(json.data);
          });
        });

        it('should throw error with no data', done => {
          const res = {};
          jsendInstance.middleware(req, res, () => {
            assert.throws(() => {
              res.jsend.success();
            });
            done();
          });
        });
      });

      describe('.fail method', () => {
        it('with japi object', done => {
          const json = { status: 'fail', data: { foo: 'bar' } };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.fail(json);
          });
        });

        it('with object data', done => {
          const json = { status: 'fail', data: { foo: 'bar' } };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.fail(json.data);
          });
        });

        it('with array data', done => {
          const json = { status: 'fail', data: [1, 2, 3] };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.fail(json.data);
          });
        });

        it('with string data', done => {
          const json = { status: 'fail', data: 'you got it' };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.fail(json.data);
          });
        });

        it('with numeric data', done => {
          const json = { status: 'fail', data: 123 };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.fail(json.data);
          });
        });

        it('with null data', done => {
          const json = { status: 'fail', data: null };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.fail(json.data);
          });
        });

        it('should throw error with no data', done => {
          const res = {};
          jsendInstance.middleware(req, res, () => {
            assert.throws(() => {
              res.jsend.fail();
            });
            done();
          });
        });
      });

      describe('.error method', () => {
        it('with message', done => {
          const json = { status: 'error', message: 'something bad' };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.error(json.message);
          });
        });

        it('with message and code', done => {
          const json = { status: 'error', message: 'something bad', code: 'BAD_THINGS' };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.error(json);
          });
        });

        it('with message and data', done => {
          const json = { status: 'error', message: 'something bad', data: { foo: 'bar' } };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.error(json);
          });
        });

        it('with message and data and code', done => {
          const json = {
            status: 'error',
            message: 'something bad',
            code: 'BAD_THINGS',
            data: { foo: 'bar' }
          };
          const res = {
            json: output => {
              assert.deepEqual(output, json);
              done();
            }
          };
          jsendInstance.middleware(req, res, () => {
            res.jsend.error(json);
          });
        });

        it('should throw error with no message', done => {
          const json = { status: 'error', code: 'BAD_THINGS', data: { foo: 'bar' } };
          const res = {};
          jsendInstance.middleware(req, res, () => {
            assert.throws(() => {
              res.jsend.error(json);
            });
            done();
          });
        });
      });
    });
  }

  describe('without strict flag', () => {
    const jsendInstance = japi;

    basicTests(jsendInstance);
  });

  describe('with strict flag', () => {
    const jsendInstance = japi({ strict: true });

    basicTests(jsendInstance);
  });
});
