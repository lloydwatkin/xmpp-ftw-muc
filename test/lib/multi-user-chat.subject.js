'use strict';

/* jshint -W030 */

var should        = require('should')
  , MultiUserChat = require('../../index')
  , helper        = require('../helper')

describe('MultiUserChat', function() {

    var muc, socket, xmpp, manager

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
        manager = {
            socket: socket,
            client: xmpp,
            trackId: function(id, callback) {
                if (typeof id !== 'object')
                    throw new Error('Stanza ID spoofing protection not implemented')
                this.callback = callback
            },
            makeCallback: function(error, data) {
                this.callback(error, data)
            }
        }
        muc = new MultiUserChat()
        muc.init(manager)
    })

    beforeEach(function() {
        socket.removeAllListeners()
        xmpp.removeAllListeners()
        muc.init(manager)
    })

    it('Errors if \'room\' key not provided', function(done) {
        xmpp.once('stanza', function() {
            done('Unexpected outgoing stanza')
        })

        socket.once('xmpp.error.client', function(error) {
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing \'room\' key')
            error.request.should.eql(request)
            xmpp.removeAllListeners('stanza')
            done()
        })
        var request = {}
        socket.send('xmpp.muc.subject', request)
    })

    it('Sends expected stanza with subject text', function(done) {
        xmpp.once('stanza', function(stanza) {
            stanza.is('message').should.be.true
            stanza.attrs.type.should.equal('groupchat')
            stanza.attrs.to.should.equal(request.room)
            should.exist(stanza.attrs.id)
            var subject = stanza.getChild('subject')
            subject.should.exist
            subject.getText().should.equal(request.subject)
            done()
        })
        var request = {
            room: 'fire@witches.coven.lit',
            subject: 'Gathering around the fire...'
        }
        socket.send(
            'xmpp.muc.subject',
            request
        )
    })

    it('Sends expected stanza without subject', function(done) {
        xmpp.once('stanza', function(stanza) {
            stanza.is('message').should.be.true
            stanza.attrs.type.should.equal('groupchat')
            stanza.attrs.to.should.equal(request.room)
            should.exist(stanza.attrs.id)
            var subject = stanza.getChild('subject')
            subject.should.exist
            subject.children.length.should.equal(0)
            subject.getText().should.be.empty
            done()
        })
        var request = {
            room: 'fire@witches.coven.lit'
        }
        socket.send(
            'xmpp.muc.subject',
            request
        )
    })

})