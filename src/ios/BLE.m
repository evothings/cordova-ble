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
//                      Class MyQueue                           //
//////////////////////////////////////////////////////////////////

@implementation MyQueue

- (MyQueue*) init
{
	self.array = [NSMutableArray array];
	return self;
}

- (void) enqueue: (id)item
{
	[self.array addObject: item];
}

- (id) dequeue
{
    id item = nil;
    if ([self.array count] != 0)
	{
        item = [self.array objectAtIndex: 0];
        [self.array removeObjectAtIndex: 0];
    }
    return item;
}

- (id) first
{
    id item = nil;
    if ([self.array count] != 0)
	{
        item = [self.array objectAtIndex: 0];
    }
    return item;
}

- (BOOL) isEmpty
{
	return 0 == [self.array count];
}

@end

//////////////////////////////////////////////////////////////////
//                     Class MyCommand                          //
//////////////////////////////////////////////////////////////////

// 	id b = ^{ NSLog(@"Hello"); };
//	((MyFun)b)();

@implementation MyCommand

- (MyCommand*) init
{
	return self;
}

- (void) doBlock
{
	(self.block)();
}

@end

//////////////////////////////////////////////////////////////////
//                     Class MyPeriperal                        //
//////////////////////////////////////////////////////////////////

@implementation MyPeripheral

/****************************************************************/
/*                       Class Methods                          */
/****************************************************************/

+ (MyPeripheral*) withBLE: (BLE*) ble
	periperal: (CBPeripheral*) peripheral
{
	// Create instance.
	MyPeripheral* my = [MyPeripheral new];

	// Set handle and connect with associated objects.
	my.handle = [ble nextHandle];
	my.ble = ble;
	my.peripheral = peripheral;
	peripheral.delegate = my;
	[peripheral setMyPerhiperal: my];

	// Store in central dictionary.
	[ble.peripherals
		setObject: my
		forKey: my.handle];

	return my;
}

/****************************************************************/
/*                      Instance Methods                        */
/****************************************************************/

- (MyPeripheral*) init
{
	self.objects = [NSMutableDictionary dictionary];
	self.commands = [MyQueue new];
	self.characteristicsCallbacks = [NSMutableDictionary dictionary];
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

- (void) addCommandForCallbackId: (NSString*)callbackId withBlock: (MyCommandBlock)block
{
	// Create command object.
	MyCommand* command = [MyCommand new];
	command.callbackId = callbackId;
	command.block = block;

	// If command queue is empty start the command now.
	BOOL startNow = [self.commands isEmpty];
	[self.commands enqueue: command];
	if (startNow)
	{
		[command doBlock];
	}
}

- (NSString*) getActiveCallbackId
{
	MyCommand* command = [self.commands first];
	return command.callbackId;
}

- (void) clearActiveCommand
{
	// Remove the active command.
	[self.commands dequeue];

	// If there is a next command start it.
	if (![self.commands isEmpty])
	{
		MyCommand* command = [self.commands first];
		[command doBlock];
	}
}

- (void) addCallbackForCharacteristic: (CBCharacteristic*)characteristic
	callbackId: (NSString*)callbackId
	isNotifyingCallback: (BOOL) notify
{
	// Create callback info.
	MyCallbackInfo* callback = [MyCallbackInfo new];
	callback.callbackId = callbackId;
	callback.isNotifyingCallback = notify;

	// Save callback for this characteristic. UUID is used as key.
	self.characteristicsCallbacks[characteristic.UUID] = callback;
}

// Note: Removes callback object if not notifying callback.
- (NSString*) getCallbackIdForCharacteristic: (CBCharacteristic*)characteristic
{
	MyCallbackInfo* callback = self.characteristicsCallbacks[characteristic.UUID];
	if (!callback.isNotifyingCallback)
	{
		[self removeCallbackForCharacteristic: characteristic];
	}
	return callback.callbackId;
}

- (void) removeCallbackForCharacteristic: (CBCharacteristic*)characteristic
{
	[self.characteristicsCallbacks removeObjectForKey: characteristic.UUID];
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
/*
	1: 'WRITE_TYPE_NO_RESPONSE',
	2: 'WRITE_TYPE_DEFAULT',
	4: 'WRITE_TYPE_SIGNED',
*/

	CBCharacteristicProperties cprop = characteristic.properties;

	// Permission values.
	// Note: Not all permission values can be mapped on iOS.
	int permissions = 0;
	if (CBCharacteristicPropertyRead & cprop)
		permissions |= 1; // PERMISSION_READ
	if (CBCharacteristicPropertyWrite & cprop)
		permissions |= 16; // PERMISSION_WRITE

	// Property values.
	int properties = 0;
	if (CBCharacteristicPropertyBroadcast & cprop)
		properties |= 1; // PROPERTY_BROADCAST
	if (CBCharacteristicPropertyRead & cprop)
		properties |= 2; // PROPERTY_READ
	if (CBCharacteristicPropertyWriteWithoutResponse & cprop)
		properties |= 4; // PROPERTY_WRITE_NO_RESPONSE
	if (CBCharacteristicPropertyWrite & cprop)
		properties |= 8; // PROPERTY_WRITE
	if (CBCharacteristicPropertyNotify & cprop)
		properties |= 16; // PROPERTY_NOTIFY
	if (CBCharacteristicPropertyIndicate & cprop)
		properties |= 32; // PROPERTY_INDICATE
	if (CBCharacteristicPropertyAuthenticatedSignedWrites & cprop)
		properties |= 64; // PROPERTY_SIGNED_WRITE
	if (CBCharacteristicPropertyExtendedProperties & cprop)
		properties |= 128; // PROPERTY_EXTENDED_PROPS

	// Set writeType.
	int writeType = 0;
	if (CBCharacteristicPropertyWriteWithoutResponse & cprop)
		writeType |= 1; // WRITE_TYPE_NO_RESPONSE
	if (CBCharacteristicPropertyAuthenticatedSignedWrites & cprop)
		writeType |= 4; // WRITE_TYPE_SIGNED
	if (0 == writeType)
		writeType = 2; // WRITE_TYPE_DEFAULT

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
	// Note: Permissions for descriptors are not available on iOS.
	int permissions = 0;

	return @{
		@"handle" : handle,
		@"uuid" : [[descriptor UUID] uuidString],
		@"permission" : [NSNumber numberWithInt: permissions]
	};
}

/****************************************************************/
/*               Implemented Interface Methods                  */
/****************************************************************/

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
			sendInt: [peripheral.RSSI intValue]
			forCallback: [self getActiveCallbackId]
			keepCallback: NO];
	}
	else
	{
		[self.ble
			sendErrorMessage: [error localizedDescription]
			forCallback: [self getActiveCallbackId]];
	}

	[self clearActiveCommand];
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
			sendArray: array
			forCallback: [self getActiveCallbackId]
			keepCallback: NO];
	}
	else
	{
		[self.ble
			sendErrorMessage: [error localizedDescription]
			forCallback: [self getActiveCallbackId]];
	}

	[self clearActiveCommand];
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
			sendArray: array
			forCallback: [self getActiveCallbackId]
			keepCallback: NO];
	}
	else
	{
		[self.ble
			sendErrorMessage: [error localizedDescription]
			forCallback: [self getActiveCallbackId]];
	}

	[self clearActiveCommand];
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
			sendArray: array
			forCallback: [self getActiveCallbackId]
			keepCallback: NO];
	}
	else
	{
		[self.ble
			sendErrorMessage: [error localizedDescription]
			forCallback: [self getActiveCallbackId]];
	}
	
	[self clearActiveCommand];
}

// Note: Called both on read and notify!
- (void) peripheral: (CBPeripheral *)peripheral
	didUpdateValueForCharacteristic: (CBCharacteristic *)characteristic
	error: (NSError *)error
{
	NSString* callbackId = [self getCallbackIdForCharacteristic: characteristic];
	// TODO: Check that callback id != nil.

	if (nil == error)
	{
		// Send back data to JS.
		NSData* buffer = characteristic.value;
		[self.ble
			sendBuffer: buffer
			forCallback: callbackId
			keepCallback: NO];
	}
	else
	{
		[self.ble
			sendErrorMessage: [error localizedDescription]
			forCallback: callbackId];
	}
}

@end

//////////////////////////////////////////////////////////////////
//                          Class BLE                           //
//////////////////////////////////////////////////////////////////

@implementation BLE

//////////////////////////////////////////////////////////////////
// TODO: Guard against parallel invocations of API calls.       //
// The API can only handle one scan, connect, etc call at once. //
//////////////////////////////////////////////////////////////////

/****************************************************************/
/*                   BLE plugin API Methods                     */
/****************************************************************/

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
	[self sendNoResultClearCallback: self.scanCallbackId];

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
			sendErrorMessage: @"connect: no device address given"
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
			sendErrorMessage: @"connect: device with given address not found"
			forCallback: command.callbackId];
		return;
	}

	// Get first found pheriperal.
	CBPeripheral* peripheral = pheriperals[0];

	if (nil == peripheral)
	{
		// Pass back error message.
		[self
			sendErrorMessage: @"connect: device not found"
			forCallback: command.callbackId];
		return;
	}

	// Create custom peripheral object.
	MyPeripheral* myPeripheral = [MyPeripheral
		withBLE: self
		periperal: peripheral];

	// Save Cordova callback id.
	myPeripheral.connectCallbackId = command.callbackId;

	// Send 'connecting' state to JS side.
	[self
		sendConnectionState: @1 // STATE_CONNECTING
		forMyPeriperhal: myPeripheral];

	// Connect. Result is given in methods:
	//   centralManager:didConnectPeripheral:
	//   centralManager:didDisconnectPeripheral:error:
	[self.central
		connectPeripheral: peripheral
		options: nil];
}

/**
 * BLE API call: close
 */
- (void) close: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	// Send 'disconnecting' state to JS side.
	[self
		sendConnectionState: @3 // STATE_DISCONNECTING
		forMyPeriperhal: myPeripheral];

	// Disconnect. Result is given in method:
	//   centralManager:didDisconnectPeripheral:error:
	[self.central cancelPeripheralConnection: myPeripheral.peripheral];
}

/**
 * BLE API call: rssi
 */
- (void) rssi: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	// Read RSSI. Result is given in callback method:
	//   peripheralDidUpdateRSSI:error:
	CBPeripheral* __weak peripheral = myPeripheral.peripheral;
	[myPeripheral
		addCommandForCallbackId: command.callbackId
		withBlock: ^{
			[peripheral readRSSI];
		}];
}

/**
 * BLE API call: services
 */
- (void) services: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	// Read services. Result is given in callback method:
	//   peripheral:didDiscoverServices:
	CBPeripheral* __weak peripheral = myPeripheral.peripheral;
	[myPeripheral
		addCommandForCallbackId: command.callbackId
		withBlock: ^{
			[peripheral discoverServices: nil];
		}];
}

- (void) characteristics: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	NSString* serviceHandle = [command.arguments objectAtIndex: 1];
	if (nil == serviceHandle)
	{
		[self
			sendErrorMessage: @"no service handle given"
			forCallback: command.callbackId];
		return;
	}

	CBService* service = [myPeripheral getObjectWithHandle: serviceHandle];
	if (nil == serviceHandle)
	{
		[self
			sendErrorMessage: @"service not found"
			forCallback: command.callbackId];
		return;
	}

	// Result is delivered in:
	//	peripheral:didDiscoverCharacteristicsForService:
	CBPeripheral* __weak peripheral = myPeripheral.peripheral;
	[myPeripheral
		addCommandForCallbackId: command.callbackId
		withBlock: ^{
			[peripheral
				discoverCharacteristics: nil
				forService: service];
			}];
}

- (void) descriptors: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.

	NSString* characteristicHandle = [command.arguments objectAtIndex: 1];
	if (nil == characteristicHandle)
	{
		[self
			sendErrorMessage: @"no characteristic handle given"
			forCallback: command.callbackId];
		return;
	}

	CBCharacteristic* characteristic =
		[myPeripheral getObjectWithHandle: characteristicHandle];
	if (nil == characteristic)
	{
		[self
			sendErrorMessage: @"characteristic not found"
			forCallback: command.callbackId];
		return;
	}

	// Result is delivered in:
	//	peripheral:didDiscoverCharacteristicsForService:
	CBPeripheral* __weak peripheral = myPeripheral.peripheral;
	[myPeripheral
		addCommandForCallbackId: command.callbackId
		withBlock: ^{
			[peripheral discoverDescriptorsForCharacteristic: characteristic];
		}];
}

- (void) readCharacteristic: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
	
	NSString* characteristicHandle = [command.arguments objectAtIndex: 1];
	if (nil == characteristicHandle)
	{
		[self
			sendErrorMessage: @"no characteristic handle given"
			forCallback: command.callbackId];
		return;
	}

	CBCharacteristic* characteristic =
		[myPeripheral getObjectWithHandle: characteristicHandle];
	if (nil == characteristic)
	{
		[self
			sendErrorMessage: @"characteristic not found"
			forCallback: command.callbackId];
		return;
	}

	// Result is delivered in:
	//	peripheral:didUpdateValueForCharacteristic:error:
	[myPeripheral
		addCallbackForCharacteristic: characteristic
		callbackId: command.callbackId
		isNotifyingCallback: NO];
	[myPeripheral.peripheral readValueForCharacteristic: characteristic];
}

- (void) readDescriptor: (CDVInvokedUrlCommand*)command
{
	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.	MyPeripheral* myPeripheral = [self getPeripheralFromCommand: command];
	if (nil == myPeripheral) return; // Error.
	
	NSString* descriptorHandle = [command.arguments objectAtIndex: 1];
	if (nil == descriptorHandle)
	{
		[self
			sendErrorMessage: @"no descriptor handle given"
			forCallback: command.callbackId];
		return;
	}

	CBDescriptor* descriptor =
		[myPeripheral getObjectWithHandle: descriptorHandle];
	if (nil == descriptor)
	{
		[self
			sendErrorMessage: @"descriptor not found"
			forCallback: command.callbackId];
		return;
	}

	// Result is delivered in:
	//	peripheral:didUpdateValueForDescriptor:error:
	CBPeripheral* __weak peripheral = myPeripheral.peripheral;
	[myPeripheral
		addCommandForCallbackId: command.callbackId
		withBlock: ^{
			[peripheral readValueForDescriptor: descriptor];
		}];
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
		sendScanInfoForPeriperhal: peripheral
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
		sendConnectionState: @2 // STATE_CONNECTED
		forMyPeriperhal: [peripheral getMyPerhiperal]];
}

- (void)centralManager: (CBCentralManager *)central
	didFailToConnectPeripheral: (CBPeripheral *)peripheral
	error: (NSError *)error
{
	NSLog(@"didFailToConnectPeripheral: %@", peripheral);

	// Lazy code reuse.
	// TODO: Call error callback instead?
	[self
		centralManager: central
		didDisconnectPeripheral: peripheral
		error: error];
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

	// Send disconnected state to JS.
	[self
		sendConnectionState: @0 // STATE_DISCONNECTED
		forMyPeriperhal: myPeripheral];

	// Clear callback on the JS side.
	[self sendNoResultClearCallback: myPeripheral.connectCallbackId];

	// Remove from dictionary and clean up.
	[self.peripherals removeObjectForKey: myPeripheral.handle];
	myPeripheral.peripheral = nil;
	[peripheral setMyPerhiperal: nil];
	myPeripheral.ble = nil;
	myPeripheral.connectCallbackId = nil;
}

/****************************************************************/
/*                      Instance Methods                        */
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
			sendErrorMessage: @"no device handle given"
			forCallback: command.callbackId];
		return nil;
	}

	MyPeripheral* myPeripheral = self.peripherals[deviceHandle];
	if (nil == myPeripheral)
	{
		[self
			sendErrorMessage: @"device not found"
			forCallback: command.callbackId];
		return nil;
	}

	return myPeripheral;
}

/**
 * Internal helper method.
 */
- (void) sendScanInfoForPeriperhal: (CBPeripheral *)peripheral
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
		sendDictionary: info
		forCallback: self.scanCallbackId
		keepCallback: YES];
}

/**
 * Internal helper method.
 */
- (void) sendConnectionState: (NSNumber *)state
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
		sendDictionary: info
		forCallback: myPeripheral.connectCallbackId
		keepCallback: YES];
}

/**
 * Helper method.
 * Tell Cordova to clear the callback function associated
 * with the given callback id.
 */
- (void) sendNoResultClearCallback: (NSString*)callbackId
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
- (void) sendErrorMessage: (NSString*)errorMessage
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
- (void) sendDictionary: (NSDictionary*)dictionary
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
- (void) sendArray: (NSArray*)array
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
- (void) sendInt: (int)value
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

/**
 * Helper method.
 * Send back a byte buffer to Cordova.
 */
- (void) sendBuffer: (NSData*)buffer
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep
{
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_OK
		messageAsArrayBuffer: buffer];
	[result setKeepCallbackAsBool: keep];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

@end
