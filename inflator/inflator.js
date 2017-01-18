/*
 * noVNC: HTML5 VNC client
 * Copyright (C) 2012 Joel Martin
 * Copyright (C) 2017 Pierre Ossman for Cendio AB
 * Licensed under MPL 2.0 or any later version (see LICENSE.txt)
 */

/*jslint browser: true, white: false */

"use strict";

define(["pako/lib/zlib/inflate.js", "pako/lib/zlib/zstream.js"],
function (zlib, ZStream) {

    function Inflate() {
        this.strm = new ZStream();
        this.chunkSize = 1024 * 10 * 10;
        this.strm.output = new Uint8Array(this.chunkSize);
        this.windowBits = 5;

        zlib.inflateInit(this.strm, this.windowBits);
    };

    Inflate.prototype = {
        inflate: function (data, flush, expected) {
            this.strm.input = data;
            this.strm.avail_in = this.strm.input.length;
            this.strm.next_in = 0;
            this.strm.next_out = 0;

            // resize our output buffer if it's too small
            // (we could just use multiple chunks, but that would cause an extra
            // allocation each time to flatten the chunks)
            if (expected > this.chunkSize) {
                this.chunkSize = expected;
                this.strm.output = new Uint8Array(this.chunkSize);
            }

            this.strm.avail_out = this.chunkSize;

            zlib.inflate(this.strm, flush);

            return new Uint8Array(this.strm.output.buffer, 0, this.strm.next_out);
        },

        reset: function () {
            zlib.inflateReset(this.strm);
        }
    };

    return { Inflate: Inflate };
});
