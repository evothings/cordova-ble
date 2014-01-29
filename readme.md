
## Cordova BLE Plugin

The plugin has functions that allows your app to act as a BLE client.
You can:
* scan for devices
* connect to them
* list services, characteristics and descriptors
* read and write characteristics and descriptors
* request notification
* poll RSSI (signal strength)

To build documentation, run this command:
jsdoc -l -c conf.json ble.js

The iOS implementation is currently incomplete. Only startScan() and stopScan() work.

See [this](introduction.md) for a general introduction to BLE programming.

See the reference documentation ([source code](https://github.com/evothings/cordova-ble/blob/master/ble.js)) for details.

See [EvoThingsExamples](https://github.com/evothings/EvoThingsExamples) for examples.
