package com.sivikaplus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableAsync
public class SivikaPlusApplication {
    public static void main(String[] args) {
        SpringApplication.run(SivikaPlusApplication.class, args);
    }
}
