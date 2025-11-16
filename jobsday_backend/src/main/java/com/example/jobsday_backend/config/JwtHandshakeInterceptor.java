package com.example.jobsday_backend.config;

import com.example.jobsday_backend.entity.CompanyMember;
import com.example.jobsday_backend.entity.User;
import com.example.jobsday_backend.repository.UserRepository;
import com.example.jobsday_backend.service.CompanyMemberService;
import com.example.jobsday_backend.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.security.Principal;
import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyMemberService companyMemberService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {
        String token = null;

        if (request instanceof ServletServerHttpRequest servletReq) {
            HttpServletRequest httpReq = servletReq.getServletRequest();

            token = httpReq.getParameter("access");
            if (token == null) {
                String auth = httpReq.getHeader("Authorization");
                if (auth != null && auth.startsWith("Bearer ")) {
                    token = auth.substring(7);
                }
            }
        }
        if (token != null && tokenService.validateToken(token)) {
            Long userId = tokenService.extractUserId(token);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                attributes.put("userId", user.getId());
                attributes.put("role", user.getRole());
                if (user.getRole() == User.Role.HR){
                    CompanyMember companyMember = companyMemberService.getMemberByUserId(user.getId());
                    attributes.put("companyMemberId", companyMember.getId());
                    attributes.put("companyId", companyMember.getCompanyId());
                }

                Principal principal = new StompPrincipal(String.valueOf(user.getId()));
                attributes.put("principal", principal);
                return true;
            }
        }
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) { }

    static class StompPrincipal implements Principal {
        private final String name;
        StompPrincipal(String name) { this.name = name; }
        @Override public String getName() { return name; }
    }
}

