package com.timora.client;

import com.timora.business.Business;
import com.timora.client.dto.ClientDetailResponse;
import com.timora.client.dto.ClientRequest;
import com.timora.client.dto.ClientResponse;
import com.timora.user.AppUser;
import com.timora.user.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;
    private final CurrentUserService currentUserService;

    public ClientController(ClientService clientService, CurrentUserService currentUserService) {
        this.clientService = clientService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<ClientResponse> listClients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long professionalId
    ) {
        Business business = requireBusiness();
        return clientService.listClients(business, query, professionalId);
    }

    @GetMapping("/{id}")
    public ClientDetailResponse getClientDetail(@PathVariable Long id) {
        Business business = requireBusiness();
        return clientService.getClientDetail(business, id);
    }

    @PostMapping
    public ClientResponse createClient(@Valid @RequestBody ClientRequest request) {
        Business business = requireBusiness();
        return clientService.createClient(business, request);
    }

    @PutMapping("/{id}")
    public ClientResponse updateClient(@PathVariable Long id, @Valid @RequestBody ClientRequest request) {
        Business business = requireBusiness();
        return clientService.updateClient(business, id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteClient(@PathVariable Long id) {
        Business business = requireBusiness();
        clientService.deleteClient(business, id);
    }

    private Business requireBusiness() {
        AppUser user = currentUserService.requireCurrentUser();
        return user.getBusiness();
    }
}
