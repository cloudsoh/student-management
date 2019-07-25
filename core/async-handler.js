const { validationResult } = require('express-validator');

export default fn => (req, res, next) => {
    // Validate request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Response error
        return res.status(422).json({ errors: errors.array() });
    }

    // Catch all uncaught exception and pass to express
    return fn(req, res, next).catch(next)
};