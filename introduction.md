## Introduction to Bluetooth Low Energy

Bluetooth is a short-range wireless communication system.
It uses the 2.4-2.5 Ghz spectrum.
Maximum range with regular equipment is between 10 and 100 meters.
Special antennae may extend this range.

Each Bluetooth device has a unique 6-byte address.
Bluetooth operates on a client-server basis.
A device may act as client, or server, or both.
Clients discover server devices by broadcasting a "device discovery" signal and listening for responses.
Once discovered, client apps may remember the server's address.
A client can establish a connection to a server. The two devices can then start communicating.

Regular Bluetooth uses RFCOMM, a TCP-like serial protocol, and allows for speeds up to 2.1 Mbps.

Bluetooth Low Energy uses GATT, a special protocol which will be described below, and allows for speeds up to 270 Kbps.

A GATT server exposes a number of *services*.
Each service has one or more *characteristics*.
Each characteristic has zero or more *descriptors*.
Each service, characteristic and descriptor has a UUID (Universally Unique IDentifier).
Each characteristic and descriptor has a *value*: an array of bytes.
A value may be read-only, read-write or write-only.

Certain descriptor UUIDs have special meanings.
The most common one is 0x2901, which indicates a read-only UTF-8 string that holds the name of the parent characteristic.

Clients may request *notification* on characteristics.
This will cause the server to send messages whenever the characteristic's value changes.
