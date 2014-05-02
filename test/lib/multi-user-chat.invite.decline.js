'use strict';

/* jshint -W030 */

var MultiUserChat = require('../../index')
  , helper        = require('../helper')

require('should')

describe('Can decline an invitation to a MUC room', function() {

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

    describe('Can send decline', function() {

        it('Returns error if \'room\' key not provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing \'room\' key')
                error.request.should.eql({})
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.send('xmpp.muc.invite.decline', {})
        })

        it('Returns error if \'to\' key not provided', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing \'to\' key')
                error.request.should.eql(request)
                xmpp.removeAllListeners('stanza')
                done()
            })
            var request = { room: 'fire@coven@witches.lit' }
            socket.send('xmpp.muc.invite.decline', request)
        })

        it('Sends the expected stanza', function(done) {
            var request = {
                room: 'fire@coven.witches.lit',
                to: 'macbeth@shakespeare.lit'
            }
            xmpp.once('stanza', function(stanza) {
                stanza.is('message').should.be.true
                stanza.attrs.to.should.equal(request.room)
                stanza.attrs.id.should.exist

                var invite = stanza.getChild('x', muc.NS_USER)
                    .getChild('decline')
                invite.should.exist
                invite.attrs.to.should.equal(request.to)
                done()
            })
            socket.send('xmpp.muc.invite.decline', request)
        })

        it('Sends expected stanza with reason', function(done) {
            var request = {
                room: 'fire@coven.witches.lit',
                to: 'macbeth@shakespeare.lit',
                reason: 'Nop !'
            }
            xmpp.once('stanza', function(stanza) {
                stanza.is('message').should.be.true
                stanza.attrs.to.should.equal(request.room)
                stanza.attrs.id.should.exist

                stanza.getChild('x', muc.NS_USER)
                    .getChild('decline')
                    .getChildText('reason')
                    .should.equal(request.reason)

                done()
            })
            socket.send('xmpp.muc.invite.decline', request)
        })

    })

    describe('Handles invitations declines', function() {

        it('Handles declines', function() {
            muc.handles(helper.getStanza('decline')).should.be.true
        })

        it('Sends event to user', function(done) {
            socket.once('xmpp.muc.invite.decline', function(data) {
                data.room.should.equal('room@muc.coven.witches.lit')
                data.from.should.eql({
                    domain: 'witches.lit',
                    user: 'witch1'
                })
                done()
            })
            muc.handle(helper.getStanza('decline')).should.be.true
        })

    })

})