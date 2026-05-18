export const API_LIST = {
    pregnancies: {
        post: "/api/pregnancies/fchv-sync/"
    },
    mother: {
    request_otp: "/api/mothers/request-otp",
    register: "/api/mothers/register",
    create: "/api/mothers/",
    fetch: "/api/mothers/",
    refresh: "/api/token/refresh/",
    update: "/api/mothers/{id}/",
    delete: "/api/mothers/{id}/",
    details: "/api/mothers/{id}",
    phone_verify: "/api/mothers/phone-verify",
    mother_sync: "/api/mothers/fchv-sync/"
  },
   sync: {
    unsynced_table_list: "/api/mothers/sync-tables-list"
  },
  token: {
    post: "/api/token/"
  }
}