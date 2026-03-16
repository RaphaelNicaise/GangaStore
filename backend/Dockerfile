FROM ruby:3.3.0

# Dependencias necesarias para Postgres y compilación de gemas
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev nodejs postgresql-client

WORKDIR /app

# Instalamos gemas
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Copiamos el código
COPY . .

# Permisos para los ejecutables
RUN chmod +x bin/*

EXPOSE 3000

# Forzamos entorno de desarrollo
ENV RAILS_ENV=development

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]