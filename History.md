1.0.2 / 2015-07-13
===================
 * Checking and fixing corrupted/incomplete `npm install`s

1.0.1 / 2015-07-12
===================
 * Leaving development database behind
  * Due to unknown erros when starting up mongod for existent files db copied
  from meteor, the electrified app will now start with a blank database, so any
  seeds your app has will be done again in the first run of your packaged app

1.0.0 / 2015-07-12
===================
 * Hello World