import express, {NextFunction, Request, Response} from "express";
import routerLogin from "./routes/login";
import routerLogout from "./routes/logout";
import routerOAuth from "./routes/oauth";
import routerAccount from "./routes/settings";
import path from "path";
import cookieParser from "cookie-parser";
import {INTERNAL_SERVER_ERROR, NOT_FOUND} from "./errors";
import config from "./config/config.json";
import morgan from "morgan";
import helmet from "helmet";
import UserParser from "./Util/MiddlewareParseUser";
import ServerHeader from "./Util/MiddlewareServerHeader";
import * as Database from "./database/Database";

const app = express();

app.use(morgan("[:date[iso]] :method :url :status :res[content-length] - :response-time ms"));
app.use(helmet({
    hidePoweredBy: true,
    contentSecurityPolicy: {
        directives: {
            "default-src": "'self' " + config.security.allowedResourceOrigins.join(" ")
        },
        useDefaults: false
    }
}));

app.use(ServerHeader(config.ui.globalPlaceholder.serviceName));

app.use(express.json({
    strict: true,
    type: "application/json"
}));
app.use(express.urlencoded({
    extended: true,
    type: "application/x-www-form-urlencoded"
}));
app.use(cookieParser(config.secret.session_secret, {
    decode(val: string): string {
        return Buffer.from(val, "base64").toString("utf8");
    }
}));
app.use(UserParser);

app.use("/assets/", express.static(path.join(__dirname, "public", "assets"), {
    etag: false,
    index: "index.html",
    redirect: true
}));

app.use("/login", routerLogin);
app.use("/logout", routerLogout);
app.use("/oauth", routerOAuth);
app.use("/settings", routerAccount);

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err);
    res.status(500).json(INTERNAL_SERVER_ERROR("Exception while handling request.", "The server has run into an exception. Please try again later.", err));
}

app.use(errorHandler);
app.use((req, res, next) => res.status(404).json(NOT_FOUND("Page/Endpoint not found.", "The requested url does not exist.")))

app.listen(config.server.port, () => {
    Database.init();
    console.log("Listening...");
});
