/*
Copyright 2014 Evothings AB

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <CoreBluetooth/CBService.h>
#import <Cordova/CDVPlugin.h>

//////////////////////////////////////////////////////////////////
//                      Class EVOQueue                          //
//////////////////////////////////////////////////////////////////

@interface EVOQueue : NSObject

@property NSMutableArray* array;

- (EVOQueue*) init;
- (void) enqueue: (id)item;
- (id) dequeue;
- (id) first;
- (BOOL) isEmpty;

@end

//////////////////////////////////////////////////////////////////
//                     Class EVOCommand                         //
//////////////////////////////////////////////////////////////////

// These are operation types used in by the EVOCommand class.
const int EVO_OPERATION_RSSI = 1;
const int EVO_OPERATION_SERVICES = 2;
const int EVO_OPERATION_CHARACTERISTICS = 3;
const int EVO_OPERATION_DESCRIPTORS = 4;
const int EVO_OPERATION_READ_DESCRIPTOR = 5;
const int EVO_OPERATION_WRITE_CHARACTERISTIC = 6;
const int EVO_OPERATION_WRITE_DESCRIPTOR = 7;

// Block type used by commands.
typedef void (^EVOCommandBlock)(void);

@interface EVOCommand : NSObject

@property NSString* callbackId;
@property (strong, nonatomic) EVOCommandBlock block;
@property int type; // Operation type.
@property (weak, nonatomic) id obj; // Object in the operation.

- (EVOCommand*) init;
- (void) doBlock;

@end

//////////////////////////////////////////////////////////////////
//                        Class EVOBLE                          //
//////////////////////////////////////////////////////////////////

@interface EVOBLE : CDVPlugin <CBCentralManagerDelegate>

/* TODO: Should (strong, nonatomic) be used? Like this:
@property (strong, nonatomic) NSString* callbackId;
*/

@property int handleCounter;
@property CBCentralManager* central;
@property NSMutableDictionary* peripherals;

@property CDVInvokedUrlCommand* startScanCommand;
@property CDVInvokedUrlCommand* startScanPostponedCommand;
@property CDVInvokedUrlCommand* getBondedDevicesPostponedCommand;

// Public Cordova API.
- (void) startScan: (CDVInvokedUrlCommand*)command;
- (void) stopScan: (CDVInvokedUrlCommand*)command;
- (void) getBondedDevices: (CDVInvokedUrlCommand*)command;
- (void) getBondState: (CDVInvokedUrlCommand*)command;
- (void) bond: (CDVInvokedUrlCommand*)command;
- (void) unbond: (CDVInvokedUrlCommand*)command;
- (void) connect: (CDVInvokedUrlCommand*)command;
- (void) close: (CDVInvokedUrlCommand*)command;
- (void) rssi: (CDVInvokedUrlCommand*)command;
- (void) services: (CDVInvokedUrlCommand*)command;
- (void) characteristics: (CDVInvokedUrlCommand*)command;
- (void) descriptors: (CDVInvokedUrlCommand*)command;
- (void) readCharacteristic: (CDVInvokedUrlCommand*)command;
- (void) readDescriptor: (CDVInvokedUrlCommand*)command;
- (void) writeCharacteristic: (CDVInvokedUrlCommand*)command;
- (void) writeCharacteristicWithoutResponse: (CDVInvokedUrlCommand*)command;
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
//                   Class EVOCallbackInfo                      //
//////////////////////////////////////////////////////////////////

@interface EVOCallbackInfo : NSObject

@property NSString* callbackId;
@property BOOL isNotificationCallback;

@end

//////////////////////////////////////////////////////////////////
//                     Class EVOPeriperal                       //
//////////////////////////////////////////////////////////////////

@interface EVOPeripheral : NSObject <CBPeripheralDelegate>

@property NSNumber* handle;
@property CBPeripheral* peripheral;
@property EVOBLE* ble;
@property NSMutableDictionary* objects; // Handle to object table
@property NSString* connectCallbackId;
@property EVOQueue* commands; // Contains EVOCommand objects
@property NSMutableDictionary* characteristicsCallbacks; // Contains EVOCallbackInfo objects

// Class method (constructor).
+ (EVOPeripheral*) withBLE: (EVOBLE*) ble periperal: (CBPeripheral*) peripheral;

// Initialising.
- (EVOPeripheral*) init;

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
	withBlock: (EVOCommandBlock)block;
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
- (EVOCallbackInfo*) getCallbackForCharacteristic: (CBCharacteristic*)characteristic;
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
