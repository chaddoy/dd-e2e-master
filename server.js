'use strict';

const _        = require( 'lodash' );
const net      = require( 'net' );
const Hapi     = require( 'hapi' );
const Deque    = require( 'double-ended-queue' );
const SocketIO = require( 'socket.io' );
const server   = new Hapi.Server();
const deque    = new Deque();

const client = net.connect( { 'port' : 3434 }, function () {
	console.log( 'Connected' );
} );

server.connection( {
	'port' : 3400,
	'labels' : 'rest'
} );

server.connection( {
	'port' : 3401,
	'labels' : 'ws'
} );

server.connection( {
	'port' : 3402,
	'labels' : 'static'
} );

const rest        = server.select( 'rest' );
const ws          = server.select( 'ws' );
const staticFiles = server.select( 'static' );

rest.route( {
	'method' : 'GET',
	'path' : '/cases/{testCaseId}',
	'handler' : function ( request, reply ) {

		let data = {
			'testCase' : 'create-template-test-case-' + request.params.testCaseId
		};

		client.write( [ 'run', JSON.stringify( data ) ].join( ' ' ) );
		reply( request.params.testCaseId );

	}
} );


const io = SocketIO.listen( ws.listener );

io.sockets.on( 'connection', ( socket ) => {
} );

client.on( 'data', function ( data ) {
	console.log( data.toString() );
	_.forEach( io.sockets.connected, ( socket, socketId ) => {
		socket.emit( 'data-stream', { 'data' : data.toString() } );
	} );
} );

server.register( require( 'inert' ), ( error ) => {

	staticFiles.route( {
		'method' : 'GET',
		'path' : '/{param*}',
		'handler' : {
			'directory' : {
				'path' : 'public'
			}
		}
	} );

	server.start( ( error ) => {
		console.log( 'started' );
	} );

} );
