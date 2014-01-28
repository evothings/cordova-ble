/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <CoreFoundation/CoreFoundation.h>
#import <objc/runtime.h>
#import "BLE.h"

//////////////////////////////////////////////////////////////////
//                  Class Extension CBUUID                      //
//////////////////////////////////////////////////////////////////

@interface CBUUID (StringExtraction)

- (NSString *) uuidString;

@end

@implementation CBUUID (StringExtraction)

- (NSString *) uuidString
{
	NSData* data = [self data];

	NSUInteger bytesToConvert = [data length];
	const unsigned char* uuidBytes = [data bytes];
	NSMutableString* outputString = [NSMutableString stringWithCapacity: 16];

	for (NSUInteger currentByteIndex = 0;
		currentByteIndex < bytesToConvert;
		currentByteIndex++)
	{
		switch (currentByteIndex)
		{
			case 3:
			case 5:
			case 7:
			case 9:
				[outputString appendFormat:@"%02x-",
					uuidBytes[currentByteIndex]];
				break;
			default:
				[outputString appendFormat:@"%02x",
					uuidBytes[currentByteIndex]];
				break;
		}
	}

	return outputString;
}

@end

//////////////////////////////////////////////////////////////////
//               Class Extension CBPeripheral                   //
//////////////////////////////////////////////////////////////////

static int MyPerhiperalAssociatedObjectKey = 42;

@interface CBPeripheral (BLEPluginSupport)

- (void) setMyPerhiperal: (MyPeripheral*)myPeripheral;
- (MyPeripheral*) getMyPerhiperal;

@end

@implementation CBPeripheral (BLEPluginSupport)

- (void) setMyPerhiperal: (MyPeripheral*)myPeripheral
{
	objc_setAssociatedObject(
		self,
		&MyPerhiperalAssociatedObjectKey,
		myPeripheral,
		OBJC_ASSOCIATION_ASSIGN);
}

- (MyPeripheral*) getMyPerhiperal
{
	return objc_getAssociatedObject(
		self,
		&MyPerhiperalAssociatedObjectKey);
}

@end


//////////////////////////////////////////////////////////////////
//                     Class MyPeriperal                        //
//////////////////////////////////////////////////////////////////

@implementation MyPeripheral

+ (MyPeripheral*) withBLE: (BLE*) ble
	periperal: (CBPeripheral*) peripheral
{
	MyPeripheral* my = [MyPeripheral new];

	my.handle = [ble nextHandle];
	my.ble = ble;
	my.peripheral = peripheral;
	peripheral.delegate = my;
	[peripheral setMyPerhiperal: my];

	// Store in dictionary.
	[ble.peripherals
		setObject: my
		forKey: my.handle];

	return my;
}

- (MyPeripheral*) init
{
	self.objects = [NSMutableDictionary dictionary];
	return self;
}


- (void) addObject: (id)obj withHandle: (id)handle
{
	self.objects[handle] = obj;
}

- (id) getObjectWithHandle: (id)handle
{
	return self.objects[handle];
}

- (void) removeObjectWithHandle: (id)handle
{
	[self.objects removeObjectForKey: handle];
}

- (void) addCallbackId: (id)callbackId withSignature: (NSString*)signature forObject: (id)obj
{
	NSString* key = [NSString
		stringWithFormat: @"CallbackKey:%i:%@/",
		[obj hash], signature];
	[self
		addObject: callbackId
		withHandle: key];
}

- (id) getCallbackIdWithSignature: (NSString*)signature forObject: (id)obj
{
	NSString* key = [NSString
		stringWithFormat: @"CallbackKey:%i:%@/",
		[obj hash], signature];
	return [self getObjectWithHandle: key];
}

- (void) clearCallbackIdWithSignature: (NSString*)signature forObject: (id)obj
{
	NSString* key = [NSString
		stringWithFormat: @"CallbackKey:%i:%@/",
		[obj hash], signature];
	[self removeObjectWithHandle: key];
}

/**
 * From interface CBPeripheralDelegate.
 * Called when RSSI value has been read from device.
 */
- (void) peripheralDidUpdateRSSI: (CBPeripheral *)peripheral
	error: (NSError *)error
{
	if (nil == error)
	{
		// Success. Send back data to JS.
		[self.ble
			returnInt: [peripheral.RSSI intValue]
			forCallback: [self getCallbackIdWithSignature: @"rssi" forObject: self]
			keepCallback: NO];
	}
	else
	{
		[self.ble
			returnErrorMessage: [error localizedDescription]
			forCallback: [self getCallbackIdWithSignature: @"rssi" forObject: self]];
	}

	[self clearCallbackIdWithSignature: @"rssi" forObject: self];
}

/**
 * From interface CBPeripheralDelegate.
 * Called when services have been read from device.
 */
- (void) peripheral: (CBPeripheral *)peripheral
	didDiscoverServices: (NSError *)error
{
	if (nil == error)
	{
		//NSLog(@"found services: %@", peripheral.services);

		// Create array with Service objects.
		NSMutableArray* array = [NSMutableArray array];
		for (CBService* service in peripheral.services)
		{
			id handle = [self.ble nextHandle];
			[self addObject: service withHandle: handle];
			[array addObject: [self
				createServiceObject: service
				withHandle: handle]];
		}

		// Send back data to JS.
		[self.ble
			returnArray: array
			forCallback: [self getCallbackIdWithSignature: @"services" forObject: self]
			keepCallback: NO];
	}
	else
	{
		[self.ble
			returnErrorMessage: [error localizedDescription]
			forCallback: [self getCallbackIdWithSignature: @"services" forObject: self]];
	}

	[self clearCallbackIdWithSignature: @"services" forObject: self];
}

- (void)peripheral: (CBPeripheral *)peripheral
	didDiscoverCharacteristicsForService: (CBService *)service
	error:(NSError *)error
{
	if (nil == error)
	{
		// Create array with Service objects.
		NSMutableArray* array = [NSMutableArray array];
		for (CBCharacteristic* characteristic in service.characteristics)
		{
			id handle = [self.ble nextHandle];
			[self addObject: characteristic withHandle: handle];
			[array addObject: [self
				createCharacteristicObject: characteristic
				withHandle: handle]];
		}

		// Send back data to JS.
		[self.ble
			returnArray: array
			forCallback: [self
				getCallbackIdWithSignature: @"characteristics"
				forObject: service]
			keepCallback: NO];
	}
	else
	{
		[self.ble
			returnErrorMessage: [error localizedDescription]
			forCallback: [self
				getCallbackIdWithSignature: @"characteristics"
				forObject: service]];
	}

	[self
		clearCallbackIdWithSignature: @"characteristics"
		forObject: service];
}

- (void)peripheral: (CBPeripheral *)peripheral didDiscoverDescriptorsForCharacteristic: (CBCharacteristic *)characteristic error: (NSError *)error
{
	NSLog(@"found descriptors: %@", characteristic.descriptors);

	if (nil == error)
	{
		// Create array with Descriptor objects.
		NSMutableArray* array = [NSMutableArray array];
		for (CBDescriptor* descriptor in characteristic.descriptors)
		{
			id handle = [self.ble nextHandle];
			[self addObject: descriptor withHandle: handle];
			[array addObject: [self
				createDescriptorObject: descriptor
				withHandle: handle]];
		}

		// Send back data to JS.
		[self.ble
			returnArray: array
			forCallback: [self
				getCallbackIdWithSignature: @"descriptors"
				forObject: characteristic]
			keepCallback: NO];
	}
	else
	{
		[self.ble
			returnErrorMessage: [error localizedDescription]
			forCallback: [self
				getCallbackIdWithSignature: @"descriptors"
				forObject: characteristic]];
	}

	[self
		clearCallbackIdWithSignature: @"descriptors"
		forObject: characteristic];
}

- (NSDictionary*) createServiceObject: (CBService*)service
	withHandle: (NSNumber*)handle
{
	return @{
		@"handle" : handle,
		@"uuid" : [[service UUID] uuidString],
		@"serviceType" : (service.isPrimary ?
			@0 : // SERVICE_TYPE_PRIMARY
			@1)  // SERVICE_TYPE_SECONDARY
	};
}

- (NSDictionary*) createCharacteristicObject: (CBCharacteristic*)characteristic
	withHandle: (NSNumber*)handle
{
/*
   CBCharacteristicPropertyBroadcast = 0x01,
   CBCharacteristicPropertyRead = 0x02,
   CBCharacteristicPropertyWriteWithoutResponse = 0x04,
   CBCharacteristicPropertyWrite = 0x08,
   CBCharacteristicPropertyNotify = 0x10,
   CBCharacteristicPropertyIndicate = 0x20,
   CBCharacteristicPropertyAuthenticatedSignedWrites = 0x40,
   CBCharacteristicPropertyExtendedProperties = 0x80,
   CBCharacteristicPropertyNotifyEncryptionRequired = 0x100,
   CBCharacteristicPropertyIndicateEncryptionRequired = 0x200,
*/
	CBCharacteristicProperties cprop = characteristic.properties;

/*
	1: 'PERMISSION_READ'
	2: 'PERMISSION_READ_ENCRYPTED',
	4: 'PERMISSION_READ_ENCRYPTED_MITM',
	16: 'PERMISSION_WRITE',
	32: 'PERMISSION_WRITE_ENCRYPTED',
	64: 'PERMISSION_WRITE_ENCRYPTED_MITM',
	128: 'PERMISSION_WRITE_SIGNED',
	256: 'PERMISSION_WRITE_SIGNED_MITM',
*/
	// TODO: Add permission values.
	int permissions = 0;
	if (CBCharacteristicPropertyRead & cprop)
		permissions |= 1; // PERMISSION_READ
	if (CBCharacteristicPropertyWrite & cprop)
		permissions |= 4; // PERMISSION_WRITE

/*
	1: 'PROPERTY_BROADCAST',
	2: 'PROPERTY_READ',
	4: 'PROPERTY_WRITE_NO_RESPONSE',
	8: 'PROPERTY_WRITE',
	16: 'PROPERTY_NOTIFY',
	32: 'PROPERTY_INDICATE',
	64: 'PROPERTY_SIGNED_WRITE',
	128: 'PROPERTY_EXTENDED_PROPS',
*/
	// TODO: Add property values.
	int properties = 0;
	if (characteristic.isBroadcasted)
		properties |= 1; // PROPERTY_BROADCAST
	if (CBCharacteristicPropertyRead & cprop)
		properties |= 2; // PROPERTY_READ
	if (CBCharacteristicPropertyWrite & cprop)
		properties |= 8; // PROPERTY_WRITE

/*
	1: 'WRITE_TYPE_NO_RESPONSE',
	2: 'WRITE_TYPE_DEFAULT',
	4: 'WRITE_TYPE_SIGNED',
*/
	// TODO: Set writeType.
	int writeType = 0;

	return @{
		@"handle" : handle,
		@"uuid" : [[characteristic UUID] uuidString],
		@"permission" : [NSNumber numberWithInt: permissions],
		@"property" : [NSNumber numberWithInt: properties],
		@"writeType" : [NSNumber numberWithInt: writeType]
	};
}

- (NSDictionary*) createDescriptorObject: (CBDescriptor*)descriptor
	withHandle: (NSNumber*)handle
{
/*
	1: 'PERMISSION_READ'
	2: 'PERMISSION_READ_ENCRYPTED',
	4: 'PERMISSION_READ_ENCRYPTED_MITM',
	16: 'PERMISSION_WRITE',
	32: 'PERMISSION_WRITE_ENCRYPTED',
	64: 'PERMISSION_WRITE_ENCRYPTED_MITM',
	128: 'PERMISSION_WRITE_SIGNED',
	256: 'PERMISSION_WRITE_SIGNED_MITM',
*/
	// TODO: Add permission values.
	int permissions = 0;

	return @{
		@"handle" : handle,
		@"uuid" : [[descriptor UUID] uuidString],
		@"permission" : [NSNumber numberWithInt: permissions]
	};
}

@end

//////////////////////////////////////////////////////////////////
//                          Class BLE                           //
//////////////////////////////////////////////////////////////////

@implementation BLE

/****************************************************************/
/*                   BLE plugin API Methods                     */
/****************************************************************/

//////////////////////////////////////////////////////////////////
// TODO: Guard against parallel invocations of API calls.       //
// The API can only handle one scan, connect, etc call at once. //
//////////////////////////////////////////////////////////////////

/**
 * BLE API call: startScan
 */
- (void) startScan: (CDVInvokedUrlCommand*)command
{
	// Save callbackId.
	self.scanCallbackId = command.callbackId;

	// Start scanning.
	[self scanForPeripherals];
}

/**
 * BLE API call: stopScan
 */
- (void) stopScan: (CDVInvokedUrlCommand*)command
{
	[self.central stopScan];

	// Clear callback on the JS side.
	[self returnNoResultClearCallback: self.scanCallbackId];

	self.scanCallbackId = nil;
}

/**
 * BLE API call: connect
 */
- (void) connect: (CDVInvokedUrlCommand*)command
{
	// The connect address is in the first argument.
	NSString* address = [command.arguments objectAtIndex: 0];

	// Check that address was given.
	if (nil == address)
	{
		// Pass back error message.
		[self
			returnErrorMessage: @"connect: no device address given"
			forCallback: command.callbackId];
		return;
	}

	// Get the pheripheral object for the given address.
	NSUUID* uuid = [[NSUUID UUID] initWithUUIDString: address];
	NSArray* pheriperals = [self.central
		retrievePeripheralsWithIdentifiers: @[uuid]];

	if ([pheriperals count] < 1)
	{
		// Pass back error message.
		[self
			returnErrorMessage: @"connect: device with given address not found"
			forCallback: command.callbackId];
		return;
	}

	// Get first found pheriperal.
	CBPeripheral* peripheral = pheriperals[0];

	if (nil == peripheral)
	{
		// Pass back error message.
		[self
			returnErrorMessage: @"connect: device not found"
			forCallback: command.callbackId];
		return;
	}

	// Create custom peripheral object.
	MyPeripheral* myPeripheral = [MyPeripheral
		withBLE: self
		periperal: peripheral];

	// Connect. Result is given in methods:
	//   centralManager:didConnectPeripheral:
	//   centralManager:didDisconnectPeripheral:error:
	[myPeripheral
		addCallbackId: command.callbackId
		withSignature: @"connect"
		forObject: myPeripheral];
	[self.central
		connectPeripheral: peripheral
		options: nil];

	// Send connection state to JS side.
	[self
		returnConnectionState: @1 // STATE_CONNECTING
		forMyPeriperhal: myPeripheral];
}

/**
 * BLE API call: close
 */
- (void) close: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	// Disconnect. Result is given in method:
	//   centralManager:didDisconnectPeripheral:error:
	[self.central cancelPeripheralConnection: myPeripheral.peripheral];

	// Send disconnecting state to JS side.
	[self
		returnConnectionState: @3 // STATE_DISCONNECTING
		forMyPeriperhal: myPeripheral];
}

/**
 * BLE API call: rssi
 */
- (void) rssi: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	// Save callbackId.
	[myPeripheral
		addCallbackId: command.callbackId
		withSignature: @"rssi"
		forObject: myPeripheral];

	// Read RSSI. Result is given in callback method:
	//   peripheralDidUpdateRSSI:error:
	[myPeripheral.peripheral readRSSI];
}

/**
 * BLE API call: services
 */
- (void) services: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	// Save callbackId.
	[myPeripheral
		addCallbackId: command.callbackId
		withSignature: @"services"
		forObject: myPeripheral];

	// Read services. Result is given in callback method:
	//   peripheral:didDiscoverServices:
	[myPeripheral.peripheral discoverServices: nil];
}

- (void) characteristics: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	NSString* serviceHandle = [command.arguments objectAtIndex: 1];
	if (nil == serviceHandle)
	{
		[self
			returnErrorMessage: @"no service handle given"
			forCallback: command.callbackId];
		return;
	}

	CBService* service = [myPeripheral getObjectWithHandle: serviceHandle];
	if (nil == serviceHandle)
	{
		[self
			returnErrorMessage: @"service not found"
			forCallback: command.callbackId];
		return;
	}

	// Result is delivered in:
	//	peripheral:didDiscoverCharacteristicsForService:
	[myPeripheral
		addCallbackId: command.callbackId
		withSignature: @"characteristics"
		forObject: service];
	[myPeripheral.peripheral
		discoverCharacteristics: nil
		forService: service];
}

- (void) descriptors: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	NSString* characteristicHandle = [command.arguments objectAtIndex: 1];
	if (nil == characteristicHandle)
	{
		[self
			returnErrorMessage: @"no characteristic handle given"
			forCallback: command.callbackId];
		return;
	}

	CBCharacteristic* characteristic =
		[myPeripheral getObjectWithHandle: characteristicHandle];
	if (nil == characteristic)
	{
		[self
			returnErrorMessage: @"characteristic not found"
			forCallback: command.callbackId];
		return;
	}

	// Result is delivered in:
	//	peripheral:didDiscoverCharacteristicsForService:
	[myPeripheral
		addCallbackId: command.callbackId
		withSignature: @"descriptors"
		forObject: characteristic];
	[myPeripheral.peripheral
		discoverDescriptorsForCharacteristic: characteristic];
}

- (void) readCharacteristic: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
}

- (void) readDescriptor: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
}

- (void) writeCharacteristic: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
}

- (void) writeDescriptor: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
}

- (void) enableNotification: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
}

- (void) disableNotification: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
}

- (void) reset: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
}


/****************************************************************/
/*               Implemented Interface Methods                  */
/****************************************************************/

/**
 * From interface CDVPlugin.
 * Called when plugin is initialized by Cordova.
 */
- (void) pluginInitialize
{
	self.scanIsWaiting = NO;

	self.central = [[CBCentralManager alloc]
		initWithDelegate: self
		queue: nil];

	self.peripherals = [NSMutableDictionary dictionary];

	self.handleCounter = 0;
}

/**
 * From interface CBCentralManagerDelegate.
 * Called when a device is discovered.
 */
- (void) centralManager: (CBCentralManager *)central
	didDiscoverPeripheral: (CBPeripheral *)peripheral
	advertisementData: (NSDictionary *)advertisementData
	RSSI: (NSNumber *)RSSI

{
	[self
		returnScanInfoForPeriperhal: peripheral
		RSSI: RSSI];
}

/**
 * From interface CBCentralManagerDelegate.
 * Called when the central manager changes state.
 */
- (void) centralManagerDidUpdateState: (CBCentralManager *)central
{
	// Start scan if we have a waiting scan that failed because
	// of the Central Manager not being on.
	if (central.state == CBCentralManagerStatePoweredOn
		&& self.scanIsWaiting)
	{
		[self scanForPeripherals];
	}
}

/**
 * From interface CBCentralManagerDelegate.
 * Called when a device is connected.
 */
- (void) centralManager: (CBCentralManager *)central
	didConnectPeripheral: (CBPeripheral *)peripheral
{
	NSLog(@"didConnectPeripheral: %@", peripheral);

	[self
		returnConnectionState: @2 // STATE_CONNECTED
		forMyPeriperhal: [peripheral getMyPerhiperal]];
}

// TODO: Call error callback?
// Refactor duplicated code.
- (void)centralManager: (CBCentralManager *)central
	didFailToConnectPeripheral: (CBPeripheral *)peripheral
	error: (NSError *)error
{
	NSLog(@"didFailToConnectPeripheral: %@", peripheral);

	MyPeripheral* myPeripheral = [peripheral getMyPerhiperal];

	[self
		returnConnectionState: @0 // STATE_DISCONNECTED
		forMyPeriperhal: myPeripheral];

	// Clear callback on the JS side.
	[self returnNoResultClearCallback: [myPeripheral
		getCallbackIdWithSignature: @"connect"
		forObject: myPeripheral]];

	// Remove from dictionary and clean up.
	[self.peripherals removeObjectForKey: myPeripheral.handle];
	[myPeripheral
		clearCallbackIdWithSignature: @"connect"
		forObject: myPeripheral];
	myPeripheral.peripheral = nil;
	myPeripheral.ble = nil;
}

/**
 * From interface CBCentralManagerDelegate.
 * Called when a device is disconnected.
 */
- (void) centralManager: (CBCentralManager *)central
	didDisconnectPeripheral: (CBPeripheral *)peripheral
	error: (NSError *)error
{
	MyPeripheral* myPeripheral = [peripheral getMyPerhiperal];

	[self
		returnConnectionState: @0 // STATE_DISCONNECTED
		forMyPeriperhal: myPeripheral];

	// Clear callback on the JS side.
	[self returnNoResultClearCallback: [myPeripheral
		getCallbackIdWithSignature: @"connect"
		forObject: myPeripheral]];

	// Remove from dictionary and clean up.
	[self.peripherals removeObjectForKey: myPeripheral.handle];
	[myPeripheral
		clearCallbackIdWithSignature: @"connect"
		forObject: myPeripheral];
	myPeripheral.peripheral = nil;
	myPeripheral.ble = nil;
}

/****************************************************************/
/*                      Internal Methods                        */
/****************************************************************/

- (NSNumber*) nextHandle
{
	return [NSNumber numberWithInt: ++(self.handleCounter)];
}

/**
 * Internal helper method.
 */
- (int) scanForPeripherals
{
	if (self.central.state != CBCentralManagerStatePoweredOn)
	{
		//NSLog(@"scanForPeripherals failed: BLE is off");
		self.scanIsWaiting = YES;
		return -1;
	}

	self.scanIsWaiting = NO;

	[self.central
		scanForPeripheralsWithServices: nil
		options: nil];

	return 0;
}

/**
 * Internal helper method.
 */
- (MyPeripheral*) getPeripheralFromCommand: (CDVInvokedUrlCommand*)command
{
	NSString* deviceHandle = [command.arguments objectAtIndex: 0];
	if (nil == deviceHandle)
	{
		[self
			returnErrorMessage: @"no device handle given"
			forCallback: command.callbackId];
		return nil;
	}

	MyPeripheral* myPeripheral = self.peripherals[deviceHandle];
	if (nil == myPeripheral)
	{
		[self
			returnErrorMessage: @"device not found"
			forCallback: command.callbackId];
		return nil;
	}

	return myPeripheral;
}

/**
 * Internal helper method.
 */
- (void) returnScanInfoForPeriperhal: (CBPeripheral *)peripheral
	RSSI: (NSNumber *)RSSI
{
	// Create an info object.
	// The UUID is used as the address of the device (the 6-byte BLE address
	// does not seem to be directly available on iOS).
	NSDictionary* info = @{
		@"address" : [peripheral.identifier UUIDString],
		@"rssi" : RSSI,
		@"name" : peripheral.name,
		@"scanRecord" : @""
	};

	// Send back data to JS.
	[self
		returnDictionary: info
		forCallback: self.scanCallbackId
		keepCallback: YES];
}

/**
 * Internal helper method.
 */
- (void) returnConnectionState: (NSNumber *)state
	forMyPeriperhal: (MyPeripheral *)myPeripheral
{
	// Create an info object.
	// The UUID is used as the address of the device (the 6-byte BLE address
	// does not seem to be directly available on iOS).
	NSDictionary* info = @{
		@"device" : myPeripheral.handle,
		@"state" : state
	};

	// Send back data to JS.
	[self
		returnDictionary: info
		forCallback: [myPeripheral
			getCallbackIdWithSignature: @"connect"
			forObject: myPeripheral]
		keepCallback: YES];
}

/**
 * Helper method.
 * Tell Cordova to clear the callback function associated
 * with the given callback id.
 */
- (void) returnNoResultClearCallback: (NSString*)callbackId
{
	// Clear callback on the JS side.
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_NO_RESULT];
	[result setKeepCallbackAsBool: NO];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

/**
 * Helper method.
 * Send back an error message to Cordova.
 */
- (void) returnErrorMessage: (NSString*)errorMessage
	forCallback: (NSString*)callbackId
{
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_ERROR
		messageAsString: errorMessage];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

/**
 * Helper method.
 * Send back a dictionary object to Cordova.
 */
- (void) returnDictionary: (NSDictionary*)dictionary
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep
{
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_OK
		messageAsDictionary: dictionary];
	[result setKeepCallbackAsBool: keep];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

/**
 * Helper method.
 * Send back an array to Cordova.
 */
- (void) returnArray: (NSArray*)array
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep
{
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_OK
		messageAsArray: array];
	[result setKeepCallbackAsBool: keep];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

/**
 * Helper method.
 * Send back an int value to Cordova.
 */
- (void) returnInt: (int)value
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep
{
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_OK
		messageAsInt: value];
	[result setKeepCallbackAsBool: keep];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

@end
