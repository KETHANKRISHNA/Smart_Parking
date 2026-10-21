package com.smartparking.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the bundled React app for client-side routes (e.g. /admin/users, /booking/ticket/12) so a browser
 * refresh or a shared deep link loads index.html and lets react-router take over. API, actuator, docs and
 * file requests (anything with a dot, such as /assets/app.js) are left alone.
 */
@Controller
public class SpaForwardController {

    private static final String NOT_BACKEND = "(?!api$|actuator$|swagger-ui$|api-docs$|v3$|h2-console$)[^.]*";

    @GetMapping({
            "/",
            "/{p1:" + NOT_BACKEND + "}",
            "/{p1:" + NOT_BACKEND + "}/{p2:[^.]*}",
            "/{p1:" + NOT_BACKEND + "}/{p2:[^.]*}/{p3:[^.]*}",
            "/{p1:" + NOT_BACKEND + "}/{p2:[^.]*}/{p3:[^.]*}/{p4:[^.]*}"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
