CREATE TABLE user_common_addresses (
    user_id text NOT NULL,
    name text NOT NULL,
    lat numeric(10,7) NOT NULL,
    lon numeric(10,7) NOT NULL,
    count integer NOT NULL DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_common_addresses_lat_check CHECK ((lat >= ('-90'::integer)::numeric AND lat <= (90)::numeric)),
    CONSTRAINT user_common_addresses_lon_check CHECK ((lon >= ('-180'::integer)::numeric AND lon <= (180)::numeric)),
    CONSTRAINT user_common_addresses_count_check CHECK ((count >= 0)),
    PRIMARY KEY (user_id, name)
);

CREATE INDEX idx_diary_entries_creator_address
ON diary_entries(created_by, address)
WHERE address IS NOT NULL AND address <> '';
