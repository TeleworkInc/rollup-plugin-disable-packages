# Disable packages
Replace all `import ... from 'myPackage'` statements with `import ... from
'empty'`. Silence broken platform-specific packages like `fsevents`.