const STATUSES = {
  success: { required: ['status', 'data'], allowed: ['status', 'data', 'meta'] },
  fail: { required: ['status', 'data'], allowed: ['status', 'data'] },
  error: { required: ['status', 'message'], allowed: ['status', 'message', 'data', 'code'] }
};

function requireKeys(keys, json) {
  return keys.every(key => key in json);
}

function allowKeys(keys, json) {
  return Object.keys(json).every(key => ~keys.indexOf(key));
}

function japi(config, host) {
  config = config || {};
  host = host || {};

  function isValid(json) {
    const spec = STATUSES[json && json.status];
    let valid = !!spec && requireKeys(spec.required, json);

    if (config.strict) valid = valid && allowKeys(spec.allowed, json);

    return valid;
  }

  function forward(json, done) {
    if (!isValid(json)) {
      json = {
        status: 'error',
        message: 'Invalid japi object.',
        data: { originalObject: json }
      };
    }

    if (json.status === 'success') {
      done(null, json.data);
    } else {
      const err = new Error(json.message || (`Jsend response status: ${json.status}`));
      if ('code' in json) err.code = json.code;
      if ('data' in json) err.data = json.data;
      done(err, json.data);
    }
  }

  function fromArguments(err, json, meta = null) {
    if (arguments.length === 1 && err.length === 2) {
      json = err[1];
      err = err[0];
    }

    if (err) {
      json = {
        status: 'error',
        message: (typeof err === 'string')
          ? err
          : (err && err.message) || 'Unknown error. (japi)'
      };
      if (err && err.stack) json.data = { stack: err.stack };
    } else if (json === undefined) {
      json = {
        status: 'error',
        message: 'No data returned.'
      };
    } else if (!isValid(json)) {
      json = {
        status: 'success',
        data: json
      };
      if (meta) {
        json.meta = meta;
      }
    }

    return json;
  }

  function success(data, meta = null) {
    if (data === undefined) {
      throw new Error('"data" must be defined when calling japi.success. (japi)');
    }
    const result = {
      status: 'success',
      data: (data && data.status === 'success' && isValid(data))
        ? data.data
        : data
    };
    if (meta) {
      result.meta = meta;
    }
    return result;
  }

  function fail(data) {
    if (data === undefined) {
      throw new Error('"data" must be defined when calling japi.fail. (japi)');
    }
    return {
      status: 'fail',
      data: (data && data.status === 'fail' && isValid(data))
        ? data.data
        : data
    };
  }

  function error(message) {
    const json = {
      status: 'error'
    };

    if (typeof message === 'string') {
      json.message = message;
    } else if (message && message.message) {
      json.message = message.message;
      if (message.code !== undefined) json.code = message.code;
      if (message.data !== undefined) json.data = message.data;
    } else {
      throw new Error('"message" must be defined when calling japi.error. (japi)');
    }

    return json;
  }

  host.isValid = isValid;
  host.forward = forward;
  host.fromArguments = fromArguments;
  host.success = success;
  host.fail = fail;
  host.error = error;

  host.middleware = (req, res, next) => {
    const middleware = res.japi = (err, json) => {
      res.json(fromArguments(err, json));
    };

    middleware.success = (data, meta) => {
      res.json(success(data, meta));
    };
    middleware.fail = data => {
      res.json(fail(data));
    };
    middleware.error = message => {
      res.json(error(message));
    };

    next();
  };

  return host;
}

module.exports = japi(null, japi);
