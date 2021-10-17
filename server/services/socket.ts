import * as Debug from "debug";
import { Server } from "http";
import uuidv4 from "uuid/v4";
import instance from "socket.io";
import sharedSession from "express-socket.io-session";
import * as path from "path";

import { socketLog } from "../log";
import config from "../config";
import { parsers } from "../repositories/parser";

const debug = Debug.debug("socket");
let io;

export function socketServer(server: Server, session: any): void {
    io = instance(server, {
        path: path.join(config.get("relative_path"), "/socket.io")
    });

    io.use(sharedSession(session));

    io.on("connection", (socket): void => {
        debug("new connect, socketId=%s, remoteAddress=%s", socket.id, socket.conn.remoteAddress);
        debug("socket session: %O", socket.handshake.session);

        socketLog.info(
            JSON.stringify(
                {
                    status: "new connect",
                    session: socket.handshake.session,
                    id: socket.id,
                    remoteAddress: socket.conn.remoteAddress
                },
                null,
                4
            )
        );

        try {
            socket.join(Number(socket.handshake.session.passport.user.sub));
        } catch (error) {
            debug("error=%O, socketId=%s", error, socket.id);
            socketLog.error({ error, id: socket.id });
        }

        socket.on("error", (error): void => {
            debug("error=%O, socketId=%s", error, socket.id);
            socketLog.error({ error, id: socket.id });
        });

        socket.on("close", (): void => {
            debug("close socketId=%s", socket.id);
            socketLog.info({ status: "close", id: socket.id });
        });

        socket.on("disconnect", (): void => {
            debug("disconnect socketId=%s", socket.id);
            socketLog.info({ status: "disconnect", id: socket.id });
        });

        socket.on("stopImport", (id: string) => {
            parsers.delete(id);
            socket.emit("OK");
        });
    });
}

export function emit(options: { msg: string | object; userId: number; event: string }): void {
    let message = options.msg;

    io.to(options.userId).emit(options.event, message);
}
