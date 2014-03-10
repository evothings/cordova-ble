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

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <CoreBluetooth/CBService.h>
#import <Cordova/CDVPlugin.h>

//////////////////////////////////////////////////////////////////
//                      Class MyQueue                           //
//////////////////////////////////////////////////////////////////

@interface MyQueue : NSObject

@property NSMutableArray* array;

- (MyQueue*) init;
- (void) enqueue: (id)item;
- (id) dequeue;
- (id) first;
- (BOOL) isEmpty;

@end

//////////////////////////////////////////////////////////////////
//                     Class MyCommand                          //
//////////////////////////////////////////////////////////////////

// These are operation types used in by the MyCommand class.
const int OPERATION_RSSI = 1;
const int OPERATION_SERVICES = 2;
const int OPERATION_CHARACTERISTICS = 3;
const int OPERATION_DESCRIPTORS = 4;
const int OPERATION_READ_DESCRIPTOR = 5;
const int OPERATION_WRITE_CHARACTERISTIC = 6;
const int OPERATION_WRITE_DESCRIPTOR = 7;

// Block type used by commands.
typedef void (^MyCommandBlock)(void);

@interface MyCommand : NSObject

@property NSString* callbackId;
@property (strong, nonatomic) MyCommandBlock block;
@property int type; // Operation type.
@property (weak, nonatomic) id obj; // Object in the operation.

- (MyCommand*) init;
- (void) doBlock;

@end

//////////////////////////////////////////////////////////////////
//                          Class BLE                           //
//////////////////////////////////////////////////////////////////

@interface BLE : CDVPlugin <CBCentralManagerDelegate>

/* TODO: Should (strong, nonatomic) be used? Like this:
@property (strong, nonatomic) NSString* callbackId;
@property (strong, nonatomic) CBCentralManager* central;
@property (strong, nonatomic) CBPeripheral* activePeripheral;
@property (assign, nonatomic) BOOL scanIsWaiting;
*/

@property int handleCounter;
@property CBCentralManager* central;
@property NSMutableDictionary* peripherals;
@property BOOL scanIsWaiting;
@property NSString* scanCallbackId;

// Public Cordova API.
- (void) startScan: (CDVInvokedUrlCommand*)command;
- (void) stopScan: (CDVInvokedUrlCommand*)command;
- (void) connect: (CDVInvokedUrlCommand*)command;
- (void) close: (CDVInvokedUrlCommand*)command;
- (void) rssi: (CDVInvokedUrlCommand*)command;
- (void) services: (CDVInvokedUrlCommand*)command;
- (void) characteristics: (CDVInvokedUrlCommand*)command;
- (void) descriptors: (CDVInvokedUrlCommand*)command;
- (void) readCharacteristic: (CDVInvokedUrlCommand*)command;
- (void) readDescriptor: (CDVInvokedUrlCommand*)command;
- (void) writeCharacteristic: (CDVInvokedUrlCommand*)command;
- (void) writeDescriptor: (CDVInvokedUrlCommand*)command;
- (void) enableNotification: (CDVInvokedUrlCommand*)command;
- (void) disableNotification: (CDVInvokedUrlCommand*)command;
- (void) reset: (CDVInvokedUrlCommand*)command;

// Free data associated with a periperal. Disconnect the
// peripheral if the flag shouldDisconnect is true.
- (void) freePeripheral: (CBPeripheral *)peripheral
	disconnect: (bool)shouldDisconnect;

// Stop scanning, disconnect and deallocate all connected peripherals.
- (void) freePeripherals;

// Increment and get the value of the handle counter.
- (NSNumber*) nextHandle;

// Methods that send results back to JavaScript.
- (void) sendOkClearCallback: (NSString*)callbackId;
- (void) sendNoResultClearCallback: (NSString*)callbackId;
- (void) sendErrorMessage: (NSString*)errorMessage
	forCallback: (NSString*)callbackId;
- (void) sendDictionary: (NSDictionary*)dictionary
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;
- (void) sendArray: (NSArray*)array
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;
- (void) sendInt: (int)value
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;
- (void) sendBuffer: (NSData*)buffer
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;

@end

//////////////////////////////////////////////////////////////////
//                   Class MyCallbackInfo                       //
//////////////////////////////////////////////////////////////////

@interface MyCallbackInfo : NSObject

@property NSString* callbackId;
@property BOOL isNotificationCallback;

@end

//////////////////////////////////////////////////////////////////
//                     Class MyPeriperal                        //
//////////////////////////////////////////////////////////////////

@interface MyPeripheral : NSObject <CBPeripheralDelegate>

@property NSNumber* handle;
@property CBPeripheral* peripheral;
@property BLE* ble;
@property NSMutableDictionary* objects; // Handle to object table
@property NSString* connectCallbackId;
@property MyQueue* commands; // Contains MyCommand objects
@property NSMutableDictionary* characteristicsCallbacks; // Contains MyCallbackInfo objects

// Class method (constructor).
+ (MyPeripheral*) withBLE: (BLE*) ble periperal: (CBPeripheral*) peripheral;

// Initialising.
- (MyPeripheral*) init;

// Handle table for objects (like CBService, CBCharacteristic, and CBDEscriptor).
- (void) addObject: (id)obj withHandle: (id)handle;
- (id) getObjectWithHandle: (id)handle;
- (void) removeObjectWithHandle: (id)handle;

// Handling of queued command objects (operations). For many operations
// a queue of commands is used to make async operations send the result
// to the correct Cordova callback id.
- (void) addCommandForCallbackId: (NSString*)callbackId
	forObject: (id)obj
	operation: (int)type
	withBlock: (MyCommandBlock)block;
- (NSString*) getActiveCallbackId;
- (void) clearActiveCommandAndContinue;
- (void) assertCommandAvailable;
- (void) assertCommandHasObject: (id)obj andType: (int)type;

// Charactristics have their own callback management, since a notification
// needs to keep the callback "open". Moreover, the result of reading a
// characteristic as well as from a notification is develivered in the
// same iOS callback method. Thus both read and notification operations
// need to be distinguished and handled.
- (void) addCallbackForCharacteristic: (CBCharacteristic*)characteristic
	callbackId: (NSString*)callbackId
	isNotificationCallback: (BOOL) notify;
- (MyCallbackInfo*) getCallbackForCharacteristic: (CBCharacteristic*)characteristic;
- (NSString*) getCallbackIdForCharacteristic: (CBCharacteristic*)characteristic;
- (void) removeCallbackForCharacteristic: (CBCharacteristic*)characteristic;

// Helper method that looks up an object by using the handle given in a parameter
// from a JS call.
- (id) getObjectFromCommand: (CDVInvokedUrlCommand*)command atIndex: (NSUInteger) index;

// Helper methods that create data structures for JavaScript objects.
- (NSDictionary*) createServiceObject: (CBService*)service
	withHandle: (NSNumber*)handle;
- (NSDictionary*) createCharacteristicObject: (CBCharacteristic*)characteristic
	withHandle: (NSNumber*)handle;
- (NSDictionary*) createDescriptorObject: (CBDescriptor*)descriptor
	withHandle: (NSNumber*)handle;
	
@end
