package com.example.jobsday_backend.config;

import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class IpRateLimitFilter extends OncePerRequestFilter {

    @Autowired
    private IpRateLimiterService rateLimiterService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String ip = request.getRemoteAddr();
        Bucket bucket = rateLimiterService.resolveBucketForIP(ip);

        if (!bucket.tryConsume(1)) {
            response.setStatus(429);
            response.getWriter().write("Too Many Requests: limit 60 requests per minute per IP");
            return;
        }

        filterChain.doFilter(request, response);
    }
}

