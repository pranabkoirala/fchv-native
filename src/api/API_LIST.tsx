export const API_LIST = {
    pregnancies: {
      get: "/api/fchv/pregnancies/",
      post: "/api/fchv/pregnancies/sync/"
    },
    mother: {
    request_otp: "/api/mothers/request-otp",
    register: "/api/mothers/register",
    create: "/api/fchv/mothers/sync",
    fetch: "/api/fchv/mothers/",
    refresh: "/api/token/refresh/",
    update: "/api/fchv/mothers/{id}/",
    delete: "/api/fchv/mothers/{id}/",
    details: "/api/mothers/{id}",
    phone_verify: "/api/mothers/phone-verify",
    mother_sync: "/api/mothers/fchv-sync/"
  },
   sync: {
    unsynced_table_list: "/api/fchv/sync-tables-list"
  },
  token: {
    post: "/api/token/"
  },
  adolescents: {
    get: "/api/fchv/adolescent-ifa/",
    post: "/api/fchv/adolescent-ifa/sync/"
  },
  child_monitoring: {
    get: "/api/fchv/child-monitoring/",
    post: "/api/fchv/child-monitoring/sync/",
    patch: "/api/fchv/child-monitoring/{id}/"
  },
  mothers_group_meeting: {
    get: "/api/fchv/mothers-group-meetings/",
    post: "/api/fchv/mothers-group-meetings/sync/",
    patch: "/api/fchv/mothers-group-meetings/{id}/"
  },
  visits: {
    get: "/api/fchv/visits/",
    post: "/api/fchv/visits/sync/",
    patch: "/api/fchv/visits/{id}/"
  },
  todo: {
    get: "/api/fchv/todos/",
    post: "/api/fchv/todos/sync/",
    patch: "/api/fchv/todos/{id}/"
  },
  maternal_death: {
    get: "/api/fchv/maternal-deaths/",
    post: "/api/fchv/maternal-deaths/sync/",
    patch: "/api/fchv/maternal-deaths/{id}/"
  },
  newBorn_death: {
    get: "/api/fchv/newborn-deaths/",
    post: "/api/fchv/newborn-deaths/sync/",
    patch: "/api/fchv/newborn-deaths/{id}/"
  },
  supplements: {
    get: "/api/fchv/supplements/",
    post: "/api/fchv/supplements/sync/",
    patch: "/api/fchv/supplements/{id}/"
  },
    family_planning: {
    get: "/api/fchv/family-planning/",
    post: "/api/fchv/family-planning/sync/",
    patch: "/api/fchv/family-planning/{id}/"
  },
  counseling_referral: {
    get: "/api/fchv/counseling-referrals/",
    post: "/api/fchv/counseling-referrals/sync/",
    patch: "/api/fchv/counseling-referrals/{id}/"
  },
  child_counseling: {
    get: "/api/fchv/child-counseling/",
    post: "/api/fchv/child-counseling/sync/",
    patch: "/api/fchv/child-counseling/{id}/"
  },
  child_vaccination: {
    get: "/api/fchv/child-vaccinations/",
    post: "/api/fchv/child-vaccinations/sync/",
    patch: "/api/fchv/child-vaccinations/{id}/"
  },

}
