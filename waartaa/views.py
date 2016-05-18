from pyramid.view import view_config


@view_config(route_name='all', renderer='templates/mytemplate.pt')
def my_view(request):
    return {'project': 'waartaa'}
